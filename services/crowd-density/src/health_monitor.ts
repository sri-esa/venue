// Service: crowd-density
// Layer: Intelligence Layer
// Implements: Graceful Degradation System (Data Flow Scenario 5)
// Publishes To: /venues/{venueId}/system_health (RTDB)
import { db } from './shared/firestore-client';

export type HealthState = 'HEALTHY' | 'DEGRADED' | 'PARTIAL' | 'CRITICAL';

export class HealthMonitor {
  private expectedSensors = 12; // 12 zones configured
  private activeSensors: Map<string, number> = new Map();
  private venueId: string;
  private currentState: HealthState = 'HEALTHY';

  constructor(venueId: string = 'venue-001') {
    this.venueId = venueId;
  }

  recordSensorActivity(sensorId: string) {
    this.activeSensors.set(sensorId, Date.now());
  }

  async checkHealth() {
    const now = Date.now();
    let activeCount = 0;
    
    for (const [, lastActivity] of Array.from(this.activeSensors.entries())) {
      if (now - lastActivity <= 30000) {
        activeCount++;
      }
    }

    const dropRate = 1 - (activeCount / this.expectedSensors);
    
    // Check Firestore RTT
    let rttMs = 0;
    try {
      const start = Date.now();
      await db.collection('venues').doc(this.venueId).collection('system_health').doc('latency_probe').set({ ts: start });
      rttMs = Date.now() - start;
    } catch (e) {
      rttMs = 10000; // Simulate unreachable
    }

    let newState: HealthState = 'HEALTHY';
    if (dropRate >= 0.8 || rttMs >= 5000) {  // Changed fallback condition
      newState = 'CRITICAL';
    } else if (dropRate >= 0.5 || rttMs >= 5000) {
      newState = 'PARTIAL';
    } else if (dropRate >= 0.2 || rttMs >= 2000) {
      newState = 'DEGRADED';
    }

    if (newState !== this.currentState) {
      console.log(`[HEALTH] State change: ${this.currentState} -> ${newState}`);
      await db.collection('venues').doc(this.venueId).collection('system_health').doc('current').set({
        state: newState,
        dropRate,
        latencyMs: rttMs,
        updatedAt: new Date().toISOString()
      });
      // In a full implementation, we would publish to venue-alerts topic here too.
      this.currentState = newState;
    }
  }

  start() {
    setInterval(() => this.checkHealth(), 10000);
  }
}
