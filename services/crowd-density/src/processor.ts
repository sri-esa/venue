/**
 * @module processor
 * @description Crowd-density intelligence processor.
 * Ingests raw IoT sensor readings, applies exponential smoothing, classifies
 * zone density with hysteresis, batches Firestore writes, and fires alerts
 * via PubSub when thresholds are breached.
 *
 * @architecture
 * PubSub (crowd-density-raw) → ingestSensorReading()
 *   → smoothOccupancy()   (EWMA, confidence-weighted)
 *   → classifyDensity()   (hysteresis state machine)
 *   → batchWriter.queue() (batched Firestore write)
 *   → evaluateAlerts()    (PubSub: venue-alerts, fcm-notifications)
 */
import { batchWriteZones, writeAlert } from './shared/firestore-client';
import { PubSub } from '@google-cloud/pubsub';
import { randomUUID } from 'crypto';
import { createLogger } from '../../shared/logger';
import {
  DENSITY_THRESHOLDS,
  ALERT_RULES,
  FREE_TIER_LIMITS,
} from '../../shared/constants';
import { SensorError, FirestoreError } from '../../shared/errors';

const logger = createLogger('crowd-density-service');

// ─── Public types ─────────────────────────────────────────────────────────────

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

// ─── Internal classes ─────────────────────────────────────────────────────────

/**
 * @description Accumulates zone-density writes in memory and flushes them in
 * batches to Firestore. Keeps write count within the GCP free-tier limit of
 * {@link FREE_TIER_LIMITS.FIRESTORE_DAILY_WRITES} by coalescing rapid updates.
 */
class BatchWriter {
  private pendingWrites: Map<string, ZoneDensity> = new Map();
  private flushInterval: NodeJS.Timeout;

  constructor() {
    this.flushInterval = setInterval(
      () => void this.flush(),
      FREE_TIER_LIMITS.BATCH_INTERVAL_MS
    );
  }

  /**
   * @description Enqueues a zone-density update, overwriting any pending write
   * for the same zone so only the latest reading is persisted per flush cycle.
   * @param {string} zoneId - Firestore document key.
   * @param {ZoneDensity} data - Zone density snapshot to persist.
   */
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
      await Promise.all(
        Object.entries(byVenue).map(([vid, zones]) => batchWriteZones(vid, zones))
      );
    } catch (err) {
      logger.error('BatchWriter.flush', 'Batch write failed', {}, err);
    }
  }
}

/**
 * @description Per-zone EWMA smoothing cache. Persists smoothed values
 * across readings so occupancy does not spike on noisy individual readings.
 */
class SmoothingCache {
  private cache: Map<string, { smoothedValue: number; lastUpdated: number; readingCount: number }> =
    new Map();

  /**
   * @description Returns the current smoothed occupancy for a zone, or null if
   * no reading has been processed yet.
   * @param {string} zoneId - Zone identifier.
   * @returns {number | null} Smoothed occupancy ratio or null.
   */
  get(zoneId: string): number | null {
    return this.cache.get(zoneId)?.smoothedValue ?? null;
  }

  /**
   * @description Updates the smoothed occupancy for a zone.
   * @param {string} zoneId - Zone identifier.
   * @param {number} value - New smoothed occupancy value.
   */
  set(zoneId: string, value: number): void {
    const existing = this.cache.get(zoneId);
    this.cache.set(zoneId, {
      smoothedValue: value,
      lastUpdated: Date.now(),
      readingCount: existing ? existing.readingCount + 1 : 1,
    });
  }
}

/**
 * @description In-memory set of active alert keys. Prevents the same zone from
 * firing duplicate alerts until the alert is resolved.
 */
class ActiveAlertCache {
  private activeAlerts: Set<string> = new Set();

  /** @param {string} alertKey - Composite `venueId-zoneId` identifier. */
  hasActiveAlert(alertKey: string): boolean {
    return this.activeAlerts.has(alertKey);
  }

  /** @param {string} alertKey - Composite `venueId-zoneId` identifier. */
  addAlert(alertKey: string): void {
    this.activeAlerts.add(alertKey);
  }

  /** @param {string} alertKey - Composite `venueId-zoneId` identifier. */
  resolveAlert(alertKey: string): void {
    this.activeAlerts.delete(alertKey);
  }
}

// ─── Main processor ───────────────────────────────────────────────────────────

export class CrowdDensityProcessor {
  private pubsub: PubSub;
  private batchWriter: BatchWriter;
  private smoothingCache: SmoothingCache;
  private activeAlertCache: ActiveAlertCache;

  private levelSustainedCount: Map<string, { level: DensityLevel; count: number }> = new Map();
  private currentDensityLevel: Map<string, DensityLevel> = new Map();
  private seenSensors: Map<string, number> = new Map();
  /** Zones where alerts should be suppressed (e.g. SEATING areas). */
  private zoneTypes: Map<string, string> = new Map();

  constructor() {
    this.pubsub = new PubSub({ projectId: process.env.PROJECT_ID || 'smart-venue-dev' });
    this.zoneTypes.set('zone-07', 'SEATING');
    this.batchWriter = new BatchWriter();
    this.smoothingCache = new SmoothingCache();
    this.activeAlertCache = new ActiveAlertCache();
  }

  /**
   * @description Validates a raw sensor reading, applies EWMA smoothing,
   * classifies the zone density with hysteresis, queues a Firestore write,
   * and evaluates whether any alerts should be fired.
   *
   * @param {RawSensorReading} raw - Decoded sensor payload from PubSub.
   * @returns {Promise<{ processed: boolean; zoneId: string; densityLevel?: DensityLevel }>}
   *   Result object indicating whether the reading was processed and the
   *   resulting density classification.
   * @throws {SensorError} When the reading fails validation (e.g. stale timestamp,
   *   out-of-range occupancy, or low confidence).
   *
   * @example
   * const result = await processor.ingestSensorReading(raw)
   * // result: { processed: true, zoneId: 'zone-03', densityLevel: 'HIGH' }
   */
  async ingestSensorReading(
    raw: RawSensorReading
  ): Promise<{ processed: boolean; zoneId: string; densityLevel?: DensityLevel }> {
    if (!this.isValidReading(raw)) {
      return { processed: false, zoneId: raw.zoneId || 'unknown' };
    }
    if (this.isDuplicateReading(raw)) {
      return { processed: false, zoneId: raw.zoneId };
    }

    this.seenSensors.set(raw.sensorId, Date.now());

    const smoothed = this.smoothOccupancy(raw.zoneId, raw.occupancy, raw.confidence);
    const densityLevel = this.classifyDensity(raw.zoneId, smoothed);

    const zoneDensity = this.buildZoneDensity(raw, smoothed, densityLevel);
    const previousLevel = this.currentDensityLevel.get(raw.zoneId) ?? 'LOW';
    this.currentDensityLevel.set(raw.zoneId, densityLevel);

    this.batchWriter.queue(raw.zoneId, zoneDensity);
    await this.evaluateAlerts(zoneDensity, previousLevel);

    return { processed: true, zoneId: raw.zoneId, densityLevel };
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  /**
   * @description Validates required fields, occupancy/confidence ranges, and
   * reading freshness.
   * @param {RawSensorReading} raw - Sensor reading to validate.
   * @returns {boolean} True if all validation checks pass.
   */
  private isValidReading(raw: RawSensorReading): boolean {
    if (!raw.sensorId || !raw.zoneId || !raw.venueId) return false;
    if (raw.occupancy === undefined || raw.confidence === undefined) return false;
    if (raw.occupancy < 0.0 || raw.occupancy > 1.5) return false;
    if (raw.confidence < 0.7) return false;
    const ageMs = Date.now() - new Date(raw.timestamp).getTime();
    if (ageMs > ALERT_RULES.STALE_SENSOR_SECONDS * 1000) return false;
    return true;
  }

  /**
   * @description Returns true if this sensor has already been seen within the
   * deduplication window, preventing duplicate processing.
   * @param {RawSensorReading} raw - Incoming sensor reading.
   * @returns {boolean} True if the sensor should be skipped.
   */
  private isDuplicateReading(raw: RawSensorReading): boolean {
    const lastSeen = this.seenSensors.get(raw.sensorId);
    return lastSeen !== undefined &&
      (Date.now() - lastSeen) < ALERT_RULES.DEDUP_WINDOW_SECONDS * 1000;
  }

  /**
   * @description Constructs a ZoneDensity document from a validated reading.
   * @param {RawSensorReading} raw - Source sensor reading.
   * @param {number} smoothed - EWMA-smoothed occupancy ratio.
   * @param {DensityLevel} densityLevel - Classified density level.
   * @returns {ZoneDensity} Firestore-ready zone density document.
   */
  private buildZoneDensity(
    raw: RawSensorReading,
    smoothed: number,
    densityLevel: DensityLevel
  ): ZoneDensity {
    return {
      zoneId: raw.zoneId,
      venueId: raw.venueId,
      occupancy: smoothed,
      capacity: raw.capacity,
      densityLevel,
      rawCount: raw.rawCount,
      lastUpdated: new Date().toISOString(),
      sensorConfidence: raw.confidence,
    };
  }

  /**
   * @description Applies exponential weighted moving average (EWMA) smoothing
   * to raw occupancy using confidence as the weighting factor.
   *
   * @param {string} zoneId - Zone whose smoothing history to update.
   * @param {number} rawOccupancy - Raw occupancy ratio from sensor.
   * @param {number} confidence - Sensor confidence score (0–1).
   * @returns {number} Smoothed occupancy ratio.
   *
   * @example
   * const smoothed = processor.smoothOccupancy('zone-03', 0.82, 0.95)
   * // smoothed: 0.791 (blended with previous value)
   */
  smoothOccupancy(zoneId: string, rawOccupancy: number, confidence: number): number {
    const previous = this.smoothingCache.get(zoneId);
    if (previous === null) {
      this.smoothingCache.set(zoneId, rawOccupancy);
      return rawOccupancy;
    }
    const alpha = confidence * 0.3;
    const smoothed = alpha * rawOccupancy + (1 - alpha) * previous;
    this.smoothingCache.set(zoneId, smoothed);
    return smoothed;
  }

  /**
   * @description Classifies occupancy into a density level with hysteresis to
   * prevent rapid level oscillation near threshold boundaries.
   * Upgrades require {@link ALERT_RULES.HYSTERESIS_UPGRADE_READINGS} consecutive
   * readings; downgrades require {@link ALERT_RULES.HYSTERESIS_DOWNGRADE_READINGS}.
   *
   * @param {string} zoneId - Zone identifier.
   * @param {number} occupancy - Smoothed occupancy ratio.
   * @returns {DensityLevel} Stable density level after hysteresis is applied.
   *
   * @example
   * const level = processor.classifyDensity('zone-03', 0.91)
   * // level: 'CRITICAL' (after 3 consecutive readings above HIGH threshold)
   */
  classifyDensity(zoneId: string, occupancy: number): DensityLevel {
    const rawLevel = this.occupancyToRawLevel(occupancy);
    const state = this.levelSustainedCount.get(zoneId);
    const currentStableLevel = this.currentDensityLevel.get(zoneId) ?? 'LOW';

    if (!state || state.level !== rawLevel) {
      this.levelSustainedCount.set(zoneId, { level: rawLevel, count: 1 });
      return currentStableLevel;
    }

    state.count++;
    const isUpgrade = this.levelSeverity(rawLevel) > this.levelSeverity(currentStableLevel);
    const isDowngrade = this.levelSeverity(rawLevel) < this.levelSeverity(currentStableLevel);

    const upgradeReady = isUpgrade && state.count >= ALERT_RULES.HYSTERESIS_UPGRADE_READINGS;
    const downgradeReady = isDowngrade && state.count >= ALERT_RULES.HYSTERESIS_DOWNGRADE_READINGS;

    return upgradeReady || downgradeReady ? rawLevel : currentStableLevel;
  }

  /**
   * @description Maps an occupancy ratio to the corresponding raw density level
   * using DENSITY_THRESHOLDS, without applying hysteresis.
   * @param {number} occupancy - Smoothed occupancy ratio (0.0–2.0).
   * @returns {DensityLevel} The raw (pre-hysteresis) density level.
   */
  private occupancyToRawLevel(occupancy: number): DensityLevel {
    if (occupancy >= DENSITY_THRESHOLDS.HIGH) return 'CRITICAL';
    if (occupancy >= DENSITY_THRESHOLDS.MEDIUM) return 'HIGH';
    if (occupancy >= DENSITY_THRESHOLDS.LOW) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * @description Returns a numeric severity rank for a density level, used
   * to determine upgrade vs. downgrade direction.
   * @param {DensityLevel} level - The density level to rank.
   * @returns {number} Severity rank (1 = LOW … 4 = CRITICAL).
   */
  levelSeverity(level: DensityLevel): number {
    const ranks: Record<DensityLevel, number> = {
      LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4,
    };
    return ranks[level] ?? 1;
  }

  /**
   * @description Evaluates whether an alert should be fired, suppressed, or
   * resolved based on the current zone density and previous classification.
   * Publishes to `venue-alerts` and `fcm-notifications` PubSub topics.
   *
   * @param {ZoneDensity} zone - Current zone density snapshot.
   * @param {DensityLevel} previousLevel - Density level from the previous reading.
   * @returns {Promise<void>}
   *
   * @example
   * await processor.evaluateAlerts(zoneDensity, 'HIGH')
   */
  async evaluateAlerts(zone: ZoneDensity, previousLevel: DensityLevel): Promise<void> {
    if (this.zoneTypes.get(zone.zoneId) === 'SEATING') return;

    const alertKey = `${zone.venueId}-${zone.zoneId}`;

    if (this.shouldFireAlert(zone, previousLevel) && !this.activeAlertCache.hasActiveAlert(alertKey)) {
      await this.fireAlert(zone, alertKey);
    }

    if (zone.densityLevel === 'LOW' && this.activeAlertCache.hasActiveAlert(alertKey)) {
      this.activeAlertCache.resolveAlert(alertKey);
    }
  }

  /**
   * @description Returns true if the current zone state warrants a new alert.
   * @param {ZoneDensity} zone - Current zone density snapshot.
   * @param {DensityLevel} previousLevel - Previous stable density level.
   * @returns {boolean} Whether an alert should be fired.
   */
  private shouldFireAlert(zone: ZoneDensity, previousLevel: DensityLevel): boolean {
    const isNewlyCritical = zone.densityLevel === 'CRITICAL' && previousLevel !== 'CRITICAL';
    const isOverflow = zone.occupancy > DENSITY_THRESHOLDS.OVERFLOW;
    const state = this.levelSustainedCount.get(zone.zoneId);
    const isHighSustained =
      zone.densityLevel === 'HIGH' &&
      state !== undefined &&
      state.count >= ALERT_RULES.HIGH_SUSTAINED_READINGS;
    return isNewlyCritical || isHighSustained || isOverflow;
  }

  /**
   * @description Writes an alert document to Firestore and publishes it to
   * both the `venue-alerts` and `fcm-notifications` PubSub topics.
   * @param {ZoneDensity} zone - Zone that triggered the alert.
   * @param {string} alertKey - Deduplication key (`venueId-zoneId`).
   * @returns {Promise<void>}
   */
  private async fireAlert(zone: ZoneDensity, alertKey: string): Promise<void> {
    this.activeAlertCache.addAlert(alertKey);
    const alertId = `alert-${randomUUID()}`;
    const payload = {
      alertId,
      venueId: zone.venueId,
      zoneId: zone.zoneId,
      severity: 'CRITICAL',
      type: 'CROWD_DENSITY',
      message: `Zone ${zone.zoneId} is at ${zone.densityLevel} capacity.`,
      triggeredAt: new Date().toISOString(),
      resolvedAt: null,
      assignedTo: null,
    };

    try {
      await writeAlert(zone.venueId, alertId, payload);

      const alertBuffer = Buffer.from(JSON.stringify(payload));
      await this.pubsub.topic('venue-alerts').publishMessage({ data: alertBuffer });

      const fcmPayload = {
        templateType: 'CROWD_ALERT_CRITICAL',
        zoneId: zone.zoneId,
        venueId: zone.venueId,
        alertId,
      };
      await this.pubsub.topic('fcm-notifications').publishMessage({
        data: Buffer.from(JSON.stringify(fcmPayload)),
      });

      logger.info('fireAlert', 'Alert published', { alertId, zoneId: zone.zoneId, venueId: zone.venueId });
    } catch (err) {
      logger.error('fireAlert', 'Alert publish failed', { alertId, zoneId: zone.zoneId }, err);
      throw new FirestoreError('Alert write or publish failed', { alertId, zoneId: zone.zoneId });
    }
  }
}
