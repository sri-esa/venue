/**
 * @module health_monitor
 * @description Periodic system health check for the crowd-density service.
 * Evaluates live sensor coverage and Firestore round-trip latency to classify
 * the system into one of four health states, then persists the result to
 * Firestore so the staff dashboard can display it in real time.
 */
import { db } from './shared/firestore-client';
import { createLogger } from '../../shared/logger';
import { HEALTH_THRESHOLDS, ALERT_RULES } from '../../shared/constants';

const logger = createLogger('crowd-density-service');

export type HealthState = 'HEALTHY' | 'DEGRADED' | 'PARTIAL' | 'CRITICAL';

export class HealthMonitor {
  private activeSensors: Map<string, number> = new Map();
  private venueId: string;
  private currentState: HealthState = 'HEALTHY';

  constructor(venueId = 'venue-001') {
    this.venueId = venueId;
  }

  /**
   * @description Records that a specific sensor was active at the current time.
   * Called once per processed sensor reading to maintain the active-sensor set.
   *
   * @param {string} sensorId - The sensor identifier to mark as active.
   * @returns {void}
   *
   * @example
   * monitor.recordSensorActivity('sensor-zone-03-a')
   */
  recordSensorActivity(sensorId: string): void {
    this.activeSensors.set(sensorId, Date.now());
  }

  /**
   * @description Counts sensors that have been active within the
   * {@link HEALTH_THRESHOLDS.SENSOR_ACTIVE_WINDOW_MS} sliding window.
   * @param {number} now - Current timestamp (injectable for testing).
   * @returns {number} Number of currently active sensors.
   */
  private countActiveSensors(now: number): number {
    let count = 0;
    for (const lastActivity of this.activeSensors.values()) {
      if (now - lastActivity <= HEALTH_THRESHOLDS.SENSOR_ACTIVE_WINDOW_MS) count++;
    }
    return count;
  }

  /**
   * @description Performs a lightweight Firestore write to measure round-trip
   * latency. Returns 10 000 ms if Firestore is unreachable.
   * @returns {Promise<number>} RTT in milliseconds.
   */
  private async measureFirestoreRtt(): Promise<number> {
    try {
      const start = Date.now();
      await db
        .collection('venues')
        .doc(this.venueId)
        .collection('system_health')
        .doc('latency_probe')
        .set({ ts: start });
      return Date.now() - start;
    } catch {
      return 10_000; // Treat unreachable Firestore as maximum latency
    }
  }

  /**
   * @description Derives the system health state from sensor drop-rate and
   * Firestore RTT metrics.
   * @param {number} dropRate - Fraction of expected sensors that are inactive (0–1).
   * @param {number} rttMs - Firestore round-trip latency in milliseconds.
   * @returns {HealthState} Computed health state.
   */
  private computeHealthState(dropRate: number, rttMs: number): HealthState {
    if (dropRate >= HEALTH_THRESHOLDS.DROP_RATE_CRITICAL || rttMs >= HEALTH_THRESHOLDS.RTT_CRITICAL_MS) {
      return 'CRITICAL';
    }
    if (dropRate >= HEALTH_THRESHOLDS.DROP_RATE_PARTIAL) {
      return 'PARTIAL';
    }
    if (dropRate >= HEALTH_THRESHOLDS.DROP_RATE_DEGRADED || rttMs >= HEALTH_THRESHOLDS.RTT_DEGRADED_MS) {
      return 'DEGRADED';
    }
    return 'HEALTHY';
  }

  /**
   * @description Runs a single health-check cycle: measures sensor coverage and
   * Firestore RTT, derives the new health state, and persists it if changed.
   *
   * @returns {Promise<void>}
   *
   * @example
   * await monitor.checkHealth()
   */
  async checkHealth(): Promise<void> {
    const now = Date.now();
    const activeCount = this.countActiveSensors(now);
    const dropRate = 1 - activeCount / HEALTH_THRESHOLDS.EXPECTED_SENSOR_COUNT;
    const rttMs = await this.measureFirestoreRtt();

    const newState = this.computeHealthState(dropRate, rttMs);

    if (newState !== this.currentState) {
      logger.info('checkHealth', 'System health state changed', {
        from: this.currentState,
        to: newState,
        dropRate: dropRate.toFixed(2),
        rttMs,
      });
      await db
        .collection('venues')
        .doc(this.venueId)
        .collection('system_health')
        .doc('current')
        .set({ state: newState, dropRate, latencyMs: rttMs, updatedAt: new Date().toISOString() });
      this.currentState = newState;
    }
  }

  /**
   * @description Starts the periodic health-check timer using the
   * {@link ALERT_RULES.HEALTH_CHECK_INTERVAL_MS} interval.
   *
   * @returns {void}
   *
   * @example
   * monitor.start() // runs checkHealth() every 10 seconds
   */
  start(): void {
    setInterval(() => void this.checkHealth(), ALERT_RULES.HEALTH_CHECK_INTERVAL_MS);
  }
}
