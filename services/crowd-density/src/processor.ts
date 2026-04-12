// Service: crowd-density
// Layer: Intelligence Layer
// Implements: Req 1, 7
// Publishes To: fcm-notifications, venue-alerts (PubSub), /venues/{venueId}/zones/{zoneId} (RTDB), /venues/{venueId}/alerts (RTDB)
// Consumes From: crowd-density-raw (PubSub)
import { batchWriteZones, writeAlert } from './shared/firestore-client';
import { PubSub } from '@google-cloud/pubsub';
import { randomUUID } from 'crypto';

export interface RawSensorReading {
  sensorId: string;
  zoneId: string;
  venueId: string;
  timestamp: string;
  rawCount: number;
  capacity: number;
  occupancy: number;
  confidence: number;
  sensorType: string;
}

export type DensityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ZoneDensity {
  zoneId: string;
  venueId: string;
  occupancy: number;
  capacity: number;
  densityLevel: DensityLevel;
  rawCount: number;
  lastUpdated: string;
  sensorConfidence: number;
}

class BatchWriter {
  private pendingWrites: Map<string, ZoneDensity> = new Map();
  private flushInterval: NodeJS.Timeout;
  private readonly FLUSH_INTERVAL_MS = parseInt(process.env.FLUSH_INTERVAL_MS || '500');
  
  constructor() {
    this.flushInterval = setInterval(() => this.flush(), this.FLUSH_INTERVAL_MS);
  }

  queue(zoneId: string, data: ZoneDensity): void {
    this.pendingWrites.set(zoneId, data);
  }

  private async flush(): Promise<void> {
    if (this.pendingWrites.size === 0) return;
    const batch = Object.fromEntries(this.pendingWrites);
    this.pendingWrites.clear();

    const byVenue: Record<string, ZoneDensity[]> = {};
    for (const data of Object.values(batch)) {
      if (!byVenue[data.venueId]) byVenue[data.venueId] = [];
      byVenue[data.venueId].push(data);
    }
    
    try {
      await Promise.all(Object.entries(byVenue).map(([vid, zones]) => batchWriteZones(vid, zones)));
    } catch (err) {
      console.error('[BATCH] Flush failed', err);
    }
  }
}

class SmoothingCache {
  private cache: Map<string, { smoothedValue: number, lastUpdated: number, readingCount: number }> = new Map();
  private readonly CACHE_BACKUP_INTERVAL_MS = parseInt(process.env.CACHE_BACKUP_INTERVAL_MS || '60000');
  private backupInterval: NodeJS.Timeout;

  constructor(private venueId: string) {
    this.restore(venueId);
    this.backupInterval = setInterval(() => this.persist(venueId), this.CACHE_BACKUP_INTERVAL_MS);
  }

  get(zoneId: string): number | null {
    return this.cache.get(zoneId)?.smoothedValue || null;
  }

  set(zoneId: string, value: number): void {
    const existing = this.cache.get(zoneId);
    this.cache.set(zoneId, {
      smoothedValue: value,
      lastUpdated: Date.now(),
      readingCount: existing ? existing.readingCount + 1 : 1
    });
  }

  incrementReadingCount(zoneId: string): number {
    const existing = this.cache.get(zoneId);
    if (!existing) return 0;
    existing.readingCount += 1;
    return existing.readingCount;
  }

  async restore(venueId: string): Promise<void> {}
  async persist(venueId: string): Promise<void> {}
}

class ActiveAlertCache {
  private activeAlerts: Set<string> = new Set();
  private readonly ALERT_SYNC_INTERVAL_MS = parseInt(process.env.ALERT_SYNC_INTERVAL_MS || '300000');
  private syncInterval: NodeJS.Timeout;

  constructor(private venueId: string) {
    this.syncWithFirebase(venueId);
    this.syncInterval = setInterval(() => this.syncWithFirebase(venueId), this.ALERT_SYNC_INTERVAL_MS);
  }

  hasActiveAlert(zoneId: string): boolean {
    return this.activeAlerts.has(zoneId);
  }

  addAlert(zoneId: string): void {
    this.activeAlerts.add(zoneId);
  }

  resolveAlert(zoneId: string): void {
    this.activeAlerts.delete(zoneId);
  }

  async syncWithFirebase(venueId: string): Promise<void> {}
}

export class CrowdDensityProcessor {
  private pubsub: PubSub;
  private batchWriter: BatchWriter;
  private smoothingCache: SmoothingCache;
  private activeAlertCache: ActiveAlertCache;

  private levelSustainedCount: Map<string, { level: DensityLevel, count: number }> = new Map();
  private currentDensityLevel: Map<string, DensityLevel> = new Map();
  private seenSensors: Map<string, number> = new Map();
  private zoneTypes: Map<string, string> = new Map(); 

  private thresholdMedium = parseFloat(process.env.THRESHOLD_MEDIUM || '0.50');
  private thresholdHigh = parseFloat(process.env.THRESHOLD_HIGH || '0.75');
  private thresholdCritical = parseFloat(process.env.THRESHOLD_CRITICAL || '0.90');

  constructor() {
    this.pubsub = new PubSub({ projectId: process.env.PROJECT_ID || 'smart-venue-dev' });
    this.zoneTypes.set('zone-07', 'SEATING');
    this.batchWriter = new BatchWriter();
    this.smoothingCache = new SmoothingCache('default-venue');
    this.activeAlertCache = new ActiveAlertCache('default-venue');
  }

  async ingestSensorReading(raw: RawSensorReading): Promise<{ processed: boolean; zoneId: string; densityLevel?: DensityLevel }> {
    if (!raw.sensorId || !raw.zoneId || !raw.venueId || raw.occupancy === undefined || raw.confidence === undefined) {
      return { processed: false, zoneId: raw.zoneId || 'unknown' };
    }
    
    if (raw.occupancy < 0.0 || raw.occupancy > 1.5 || raw.confidence < 0.7) {
      return { processed: false, zoneId: raw.zoneId };
    }
    
    const now = Date.now();
    const readingTime = new Date(raw.timestamp).getTime();
    if (now - readingTime > 30000) {
      return { processed: false, zoneId: raw.zoneId };
    }

    const lastSeen = this.seenSensors.get(raw.sensorId);
    if (lastSeen && (now - lastSeen < 3000)) {
      return { processed: false, zoneId: raw.zoneId };
    }
    this.seenSensors.set(raw.sensorId, now);

    const smoothed = this.smoothOccupancy(raw.zoneId, raw.occupancy, raw.confidence);
    const densityLevel = this.classifyDensity(raw.zoneId, smoothed);

    const zoneDensity: ZoneDensity = {
      zoneId: raw.zoneId,
      venueId: raw.venueId,
      occupancy: smoothed,
      capacity: raw.capacity,
      densityLevel: densityLevel,
      rawCount: raw.rawCount,
      lastUpdated: new Date().toISOString(),
      sensorConfidence: raw.confidence,
    };

    const previousLevel = this.currentDensityLevel.get(raw.zoneId) || 'LOW';
    this.currentDensityLevel.set(raw.zoneId, densityLevel);

    this.batchWriter.queue(raw.zoneId, zoneDensity);

    await this.evaluateAlerts(zoneDensity, previousLevel);

    return { processed: true, zoneId: raw.zoneId, densityLevel };
  }

  smoothOccupancy(zoneId: string, rawOccupancy: number, confidence: number): number {
    const previous = this.smoothingCache.get(zoneId);
    if (previous === null) {
      this.smoothingCache.set(zoneId, rawOccupancy);
      return rawOccupancy;
    }
    const alpha = confidence * 0.3;
    const smoothed = (alpha * rawOccupancy) + ((1 - alpha) * previous);
    this.smoothingCache.set(zoneId, smoothed);
    return smoothed;
  }

  classifyDensity(zoneId: string, occupancy: number): DensityLevel {
    let rawLevel: DensityLevel = 'LOW';
    if (occupancy >= this.thresholdCritical) rawLevel = 'CRITICAL';
    else if (occupancy >= this.thresholdHigh) rawLevel = 'HIGH';
    else if (occupancy >= this.thresholdMedium) rawLevel = 'MEDIUM';

    const state = this.levelSustainedCount.get(zoneId);
    const currentStableLevel = this.currentDensityLevel.get(zoneId) || 'LOW';

    if (!state || state.level !== rawLevel) {
      this.levelSustainedCount.set(zoneId, { level: rawLevel, count: 1 });
      return currentStableLevel;
    } else {
      state.count++;
      const isUpgrade = this.levelSeverity(rawLevel) > this.levelSeverity(currentStableLevel);
      const isDowngrade = this.levelSeverity(rawLevel) < this.levelSeverity(currentStableLevel);

      if ((isUpgrade && state.count >= 3) || (isDowngrade && state.count >= 5)) {
        return rawLevel;
      }
      return currentStableLevel;
    }
  }

  levelSeverity(level: DensityLevel): number {
    switch(level) {
      case 'CRITICAL': return 4;
      case 'HIGH': return 3;
      case 'MEDIUM': return 2;
      case 'LOW': return 1;
      default: return 1;
    }
  }

  async evaluateAlerts(zone: ZoneDensity, previousLevel: DensityLevel): Promise<void> {
    if (this.zoneTypes.get(zone.zoneId) === 'SEATING') return;

    const isNewlyCritical = (zone.densityLevel === 'CRITICAL' && previousLevel !== 'CRITICAL');
    const isOverflow = (zone.occupancy > 1.0);
    const state = this.levelSustainedCount.get(zone.zoneId);
    const isHighSustained = (zone.densityLevel === 'HIGH' && state && state.count >= 10);

    const alertKey = `${zone.venueId}-${zone.zoneId}`;

    if ((isNewlyCritical || isHighSustained || isOverflow) && !this.activeAlertCache.hasActiveAlert(alertKey)) {
      this.activeAlertCache.addAlert(alertKey);
      const alertId = `alert-${randomUUID()}`;
      const payload = {
        alertId,
        venueId: zone.venueId,
        zoneId: zone.zoneId,
        severity: 'CRITICAL',
        type: 'CROWD_DENSITY',
        message: `Zone ${zone.zoneId} is at ${zone.densityLevel} capacity.`,
        triggeredAt: new Date().toISOString()
      };

      try {
        await writeAlert(zone.venueId, alertId, payload as any);
        
        const dataBuffer = Buffer.from(JSON.stringify(payload));
        const pubOpts = { topic: this.pubsub.topic('venue-alerts') };
        await pubOpts.topic.publishMessage({ data: dataBuffer });

        const fcmPub = { topic: this.pubsub.topic('fcm-notifications') };
        await fcmPub.topic.publishMessage({ data: Buffer.from(JSON.stringify({
            templateType: 'CROWD_ALERT_CRITICAL',
            zoneId: zone.zoneId,
            venueId: zone.venueId,
            alertId: alertId
        }))});
      } catch(e) {
        console.error('Alert publish failed', e);
      }
    }

    if (zone.densityLevel === 'LOW' && this.activeAlertCache.hasActiveAlert(alertKey)) {
      this.activeAlertCache.resolveAlert(alertKey);
    }
  }
}
