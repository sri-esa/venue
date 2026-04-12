// Service: queue-management
// Layer: Intelligence Layer
// Implements: Req 2, Req 6
// Publishes To: /venues/{venueId}/queues/{queueId} (RTDB), venue-alerts (PubSub)
// Consumes From: queue-events-raw (PubSub), POS Webhooks
import { db, writeQueueStatus, writeAlert } from './shared/firestore-client';
import { PubSub } from '@google-cloud/pubsub';
import { randomUUID } from 'crypto';

export type StallType = 'FOOD' | 'DRINKS' | 'MERCHANDISE' | 'RESTROOM';

export type DensityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface QueueEvent {
  queueId: string;
  stallId: string;
  stallName: string;
  stallType: StallType;
  queueLength: number;
  isOpen: boolean;
  source: string;
  timestamp: string;
  venueId: string;
}

export interface QueueStatus {
  queueId: string;
  stallId: string;
  stallName: string;
  stallType: StallType;
  currentLength: number;
  estimatedWaitMinutes: number;
  isOpen: boolean;
  coordinates?: [number, number];
  lastUpdated: string;
  staleWarning?: boolean;
}

export class LocalDensityCache {
  private densities: Map<string, DensityLevel> = new Map();
  
  updateFromPubSub(message: any): void {
    if (message.zoneId && message.densityLevel) {
      this.densities.set(message.zoneId, message.densityLevel);
    }
  }
  
  getDensityLevel(zoneId: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    return this.densities.get(zoneId) || 'MEDIUM';
  }
}

export class QueueProcessor {
  private pubsub: PubSub;
  public densityCache: LocalDensityCache;

  constructor() {
    this.pubsub = new PubSub({ projectId: process.env.PROJECT_ID || 'smart-venue-dev' });
    this.densityCache = new LocalDensityCache();
  }

  async processQueueEvent(event: QueueEvent): Promise<void> {

    // 1. Fetch nearby zone density from local cache (O(1) memory lookup)
    const localDensity = this.densityCache.getDensityLevel(event.stallId);
    
    // 2. Estimate waiting time
    const waitMins = this.estimateWaitMinutes(event.queueLength, event.stallType, new Date(event.timestamp), localDensity as any);

    // 3. Write to RTDB
    const status: QueueStatus = {
      queueId: event.queueId,
      stallId: event.stallId,
      stallName: event.stallName,
      stallType: event.stallType,
      currentLength: event.queueLength,
      estimatedWaitMinutes: waitMins,
      isOpen: event.isOpen,
      lastUpdated: new Date().toISOString()
    };

    await writeQueueStatus(event.venueId, event.queueId, status as any);

    // 4. Surge detection
    await this.detectSurges(event.venueId, status);
  }

  estimateWaitMinutes(
    currentQueueLength: number,
    stallType: StallType,
    timeOfDay: Date,
    nearbyZoneDensity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  ): number {
    let baseTimeSec = 45; // default FOOD
    if (stallType === 'DRINKS') baseTimeSec = 30;
    else if (stallType === 'MERCHANDISE') baseTimeSec = 120;
    else if (stallType === 'RESTROOM') baseTimeSec = 90;

    let estimateSec = currentQueueLength * baseTimeSec;

    // Modifiers
    if (nearbyZoneDensity === 'CRITICAL') estimateSec *= 1.4;
    
    // Check if half time (approx logic for demo: if minutes are between 45-60)
    const minutes = timeOfDay.getMinutes();
    if (minutes >= 45 && minutes < 60) {
      estimateSec *= 1.6;
    }

    let waitMins = Math.ceil(estimateSec / 60);

    if (currentQueueLength > 20) {
      waitMins += 2; // Flat penalty for operational slowdown
    }

    if (currentQueueLength > 0 && waitMins < 1) waitMins = 1;
    return waitMins;
  }

  async detectSurges(venueId: string, status: QueueStatus) {
    // This is a simplified surge detection holding last states in RTDB or memory
    // In practice, we'd fetch previous state from RTDB.
    if (!status.isOpen) {
      // Stall closed unexpectedly
      this.publishAlert(venueId, status.queueId, `Stall ${status.stallName} unexpectedly closed.`);
    } else if (status.estimatedWaitMinutes > 20) { // arbitrary surge threshold
      this.publishAlert(venueId, status.queueId, `Stall ${status.stallName} wait time is surging (${status.estimatedWaitMinutes}m)`);
    }
  }

  async publishAlert(venueId: string, queueId: string, message: string) {
      const alertId = `q-alert-${randomUUID()}`;
      const payload = {
        alertId, venueId, queueId, severity: 'HIGH', type: 'QUEUE_SURGE', message, triggeredAt: new Date().toISOString()
      };
      
      await writeAlert(venueId, alertId, payload as any);

      const pubOpts = { topic: this.pubsub.topic('venue-alerts') };
      await pubOpts.topic.publishMessage({ data: Buffer.from(JSON.stringify(payload)) });
  }

  // Called via background cron/interval
  async markStaleData(venueId: string) {
    const snap = await db.collection('venues').doc(venueId).collection('queues').get();
    if (snap.empty) return;

    const now = Date.now();
    for (const doc of snap.docs) {
        const q = doc.data();
        if (q.lastUpdated) {
            const updatedAt = new Date(q.lastUpdated).getTime();
            if (now - updatedAt > 300000) { // 5 minutes
                await db.collection('venues').doc(venueId).collection('queues').doc(doc.id).update({
                    isOpen: false,
                    staleWarning: true,
                    lastUpdated: new Date().toISOString()
                });
            }
        }
    }
  }
}
