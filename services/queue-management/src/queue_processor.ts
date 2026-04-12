/**
 * @module queue_processor
 * @description Queue intelligence processor for the queue-management service.
 * Calculates wait-time estimates, detects surges, manages manual staff
 * overrides, and marks stale queue entries in Firestore.
 *
 * @architecture
 * PubSub (queue-events-raw) → processQueueEvent()
 *   → estimateWaitMinutes()  (service-rate × queue length + modifiers)
 *   → writeQueueStatus()     (Firestore)
 *   → detectSurges()         (optional PubSub alert)
 */
import { db, writeQueueStatus, writeAlert } from './shared/firestore-client';
import { PubSub } from '@google-cloud/pubsub';
import { randomUUID } from 'crypto';
import { createLogger } from '../../shared/logger';
import { QUEUE_RULES, FREE_TIER_LIMITS } from '../../shared/constants';
import { FirestoreError } from '../../shared/errors';

const logger = createLogger('queue-management-service');

// ─── Public types ─────────────────────────────────────────────────────────────

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
  overrideExpiresAt?: number | null;
}

export interface QueueCandidate extends QueueStatus {
  distanceMeters: number;
}

export interface ManualOverride {
  waitMinutes: number;
  expiresAt: number;
}

/** Typed PubSub crowd-density update message. */
interface DensityUpdateMessage {
  zoneId: string;
  densityLevel: DensityLevel;
}

// ─── Local density cache ──────────────────────────────────────────────────────

export class LocalDensityCache {
  private densities: Map<string, DensityLevel> = new Map();

  /**
   * @description Updates the in-memory density level for a zone from a
   * typed PubSub crowd-density update message.
   * @param {DensityUpdateMessage} message - Decoded PubSub message payload.
   * @returns {void}
   *
   * @example
   * cache.updateFromPubSub({ zoneId: 'zone-03', densityLevel: 'HIGH' })
   */
  updateFromPubSub(message: DensityUpdateMessage): void {
    if (message.zoneId && message.densityLevel) {
      this.densities.set(message.zoneId, message.densityLevel);
    }
  }

  /**
   * @description Returns the cached density level for a zone, defaulting to
   * MEDIUM when no data is available (conservative estimate).
   * @param {string} zoneId - Zone identifier.
   * @returns {DensityLevel} Cached density level or 'MEDIUM'.
   *
   * @example
   * const level = cache.getDensityLevel('zone-03') // 'HIGH'
   */
  getDensityLevel(zoneId: string): DensityLevel {
    return this.densities.get(zoneId) ?? 'MEDIUM';
  }
}

// ─── Main processor ───────────────────────────────────────────────────────────

export class QueueProcessor {
  private pubsub: PubSub;
  public densityCache: LocalDensityCache;
  private manualOverrides: Map<string, ManualOverride> = new Map();

  constructor() {
    this.pubsub = new PubSub({ projectId: process.env.PROJECT_ID || 'smart-venue-dev' });
    this.densityCache = new LocalDensityCache();
  }

  /**
   * @description Processes a queue event: estimates wait time, writes queue
   * status to Firestore, and triggers surge detection.
   *
   * @param {QueueEvent} event - Queue event from PubSub or POS webhook.
   * @returns {Promise<void>}
   * @throws {FirestoreError} When the Firestore write fails.
   *
   * @example
   * await processor.processQueueEvent({
   *   queueId: 'q-food-01', stallType: 'FOOD', queueLength: 12, ...
   * })
   */
  async processQueueEvent(event: QueueEvent): Promise<void> {
    const localDensity = this.densityCache.getDensityLevel(event.stallId);
    const waitMins = this.estimateWaitMinutes(
      event.queueLength,
      event.stallType,
      new Date(event.timestamp),
      localDensity
    );

    const status: QueueStatus = {
      queueId: event.queueId,
      stallId: event.stallId,
      stallName: event.stallName,
      stallType: event.stallType,
      currentLength: event.queueLength,
      estimatedWaitMinutes: waitMins,
      isOpen: event.isOpen,
      lastUpdated: new Date().toISOString(),
    };

    try {
      await writeQueueStatus(event.venueId, event.queueId, status);
    } catch (err) {
      throw new FirestoreError('Failed to write queue status', { queueId: event.queueId });
    }

    await this.detectSurges(event.venueId, status);
  }

  /**
   * @description Selects the optimal queue for an attendee from a list of
   * candidates by minimising a weighted score of wait time (60 %) and
   * walking distance (40 %).
   *
   * @param {QueueCandidate[]} candidates - Open queues with distance computed.
   * @returns {QueueCandidate | null} The best queue, or null if none are open.
   *
   * @example
   * const best = processor.nearestQueue(candidates)
   * // best: { queueId: 'q-drinks-02', estimatedWaitMinutes: 3, ... }
   */
  nearestQueue(candidates: QueueCandidate[]): QueueCandidate | null {
    const openCandidates = candidates.filter((c) => c.isOpen);
    if (openCandidates.length === 0) return null;

    const maxWait = Math.max(...openCandidates.map((c) => c.estimatedWaitMinutes), 1);
    const maxDistance = Math.max(...openCandidates.map((c) => c.distanceMeters), 1);

    return openCandidates.reduce<QueueCandidate | null>((best, candidate) => {
      const score = this.computeCandidateScore(candidate, maxWait, maxDistance);
      if (!best) return candidate;
      const bestScore = this.computeCandidateScore(best, maxWait, maxDistance);
      return score < bestScore ? candidate : best;
    }, null);
  }

  /**
   * @description Estimates the wait time in minutes for a given queue length,
   * stall type, and contextual modifiers (zone density, time of day).
   *
   * @param {number} currentQueueLength - Number of people currently in queue.
   * @param {StallType} stallType - Type of stall (determines base service rate).
   * @param {Date} timeOfDay - Timestamp used to detect half-time windows.
   * @param {DensityLevel} nearbyZoneDensity - Zone density affecting wait time.
   * @returns {number} Estimated wait time in whole minutes (minimum 1).
   *
   * @example
   * const mins = processor.estimateWaitMinutes(15, 'FOOD', new Date(), 'CRITICAL')
   * // mins: 16 (15 × 45s / 60 × 1.4 surge)
   */
  estimateWaitMinutes(
    currentQueueLength: number,
    stallType: StallType,
    timeOfDay: Date,
    nearbyZoneDensity: DensityLevel
  ): number {
    const baseTimeSec = getServiceRateSeconds(stallType);
    let waitMins = Math.ceil((currentQueueLength * baseTimeSec) / 60);

    waitMins = applySurgeModifiers(waitMins, nearbyZoneDensity, timeOfDay, currentQueueLength);

    if (currentQueueLength > 0 && waitMins < 1) waitMins = 1;
    return waitMins;
  }

  /**
   * @description Returns true if a queue entry has not been updated within
   * the {@link QUEUE_RULES.STALE_QUEUE_MINUTES} window.
   *
   * @param {string | number} lastUpdated - ISO string or unix timestamp.
   * @param {number} [now=Date.now()] - Current time for testing purposes.
   * @returns {boolean} True if the data is stale.
   *
   * @example
   * processor.isStaleData('2024-01-01T00:00:00Z') // true (past cutoff)
   */
  isStaleData(lastUpdated: string | number, now: number = Date.now()): boolean {
    const updatedAt =
      typeof lastUpdated === 'number' ? lastUpdated : new Date(lastUpdated).getTime();
    return now - updatedAt > QUEUE_RULES.STALE_QUEUE_MINUTES * 60 * 1000;
  }

  /**
   * @description Sets a manual staff override for a queue's wait time.
   * The override expires automatically after {@link QUEUE_RULES.OVERRIDE_EXPIRY_MINUTES}.
   *
   * @param {string} queueId - Queue to override.
   * @param {number} waitMinutes - Staff-defined wait time in minutes.
   * @param {number} [now=Date.now()] - Current time (injectable for testing).
   * @returns {ManualOverride} The created override with expiry timestamp.
   *
   * @example
   * const override = processor.setManualOverride('q-food-01', 5)
   * // override: { waitMinutes: 5, expiresAt: 1234567890000 }
   */
  setManualOverride(queueId: string, waitMinutes: number, now: number = Date.now()): ManualOverride {
    const override: ManualOverride = {
      waitMinutes,
      expiresAt: now + QUEUE_RULES.OVERRIDE_EXPIRY_MINUTES * 60 * 1000,
    };
    this.manualOverrides.set(queueId, override);
    return override;
  }

  /**
   * @description Retrieves an active manual override for a queue, or null if
   * no override exists or it has expired.
   *
   * @param {string} queueId - Queue identifier.
   * @param {number} [now=Date.now()] - Current time (injectable for testing).
   * @returns {ManualOverride | null} Active override or null.
   *
   * @example
   * const override = processor.getManualOverride('q-food-01')
   * // override: { waitMinutes: 5, expiresAt: ... } or null
   */
  getManualOverride(queueId: string, now: number = Date.now()): ManualOverride | null {
    const override = this.manualOverrides.get(queueId);
    if (!override) return null;
    if (now >= override.expiresAt) {
      this.manualOverrides.delete(queueId);
      return null;
    }
    return override;
  }

  /**
   * @description Scans all queue documents for a venue and marks any that
   * have not been updated within the stale window.
   *
   * @param {string} venueId - Venue whose queues should be checked.
   * @returns {Promise<void>}
   * @throws {FirestoreError} When the Firestore query or update fails.
   *
   * @example
   * await processor.markStaleData('venue-001')
   */
  async markStaleData(venueId: string): Promise<void> {
    try {
      const snap = await db.collection('venues').doc(venueId).collection('queues').get();
      if (snap.empty) return;

      const now = Date.now();
      const staleUpdates = snap.docs
        .filter((doc) => {
          const q = doc.data() as { lastUpdated?: string | number };
          return q.lastUpdated && this.isStaleData(q.lastUpdated, now);
        })
        .map((doc) =>
          db
            .collection('venues')
            .doc(venueId)
            .collection('queues')
            .doc(doc.id)
            .update({ isOpen: false, staleWarning: true, lastUpdated: new Date().toISOString() })
        );

      await Promise.all(staleUpdates);
      if (staleUpdates.length > 0) {
        logger.info('markStaleData', 'Marked stale queues', { venueId, count: staleUpdates.length });
      }
    } catch (err) {
      throw new FirestoreError('Failed to mark stale queue data', { venueId });
    }
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private computeCandidateScore(
    candidate: QueueCandidate,
    maxWait: number,
    maxDistance: number
  ): number {
    return (candidate.estimatedWaitMinutes / maxWait) * 0.6 +
      (candidate.distanceMeters / maxDistance) * 0.4;
  }

  private async detectSurges(venueId: string, status: QueueStatus): Promise<void> {
    if (!status.isOpen) {
      await this.publishAlert(venueId, status.queueId, `Stall ${status.stallName} unexpectedly closed.`);
    } else if (status.estimatedWaitMinutes > QUEUE_RULES.SURGE_ALERT_THRESHOLD_MINUTES) {
      await this.publishAlert(
        venueId,
        status.queueId,
        `Stall ${status.stallName} wait time is surging (${status.estimatedWaitMinutes}m)`
      );
    }
  }

  private async publishAlert(venueId: string, queueId: string, message: string): Promise<void> {
    const alertId = `q-alert-${randomUUID()}`;
    const payload = {
      alertId, venueId, queueId,
      severity: 'HIGH', type: 'QUEUE_SURGE', message,
      triggeredAt: new Date().toISOString(),
      resolvedAt: null, assignedTo: null,
    };

    try {
      await writeAlert(venueId, alertId, payload);
      await this.pubsub.topic('venue-alerts').publishMessage({
        data: Buffer.from(JSON.stringify(payload)),
      });
      logger.info('publishAlert', 'Surge alert published', { alertId, queueId, venueId });
    } catch (err) {
      logger.error('publishAlert', 'Alert publish failed', { alertId, queueId }, err);
    }
  }
}

// ─── Module-level helpers (pure functions, easily unit-testable) ──────────────

/**
 * @description Returns the base service rate in seconds for a given stall type,
 * sourced from {@link QUEUE_RULES}.
 * @param {StallType} stallType - Type of stall.
 * @returns {number} Base seconds per customer served.
 *
 * @example
 * getServiceRateSeconds('DRINKS') // 30
 */
function getServiceRateSeconds(stallType: StallType): number {
  const rates: Record<StallType, number> = {
    FOOD: QUEUE_RULES.FOOD_SERVICE_RATE_SECONDS,
    DRINKS: QUEUE_RULES.DRINKS_SERVICE_RATE_SECONDS,
    MERCHANDISE: QUEUE_RULES.MERCHANDISE_SERVICE_RATE_SECONDS,
    RESTROOM: QUEUE_RULES.RESTROOM_SERVICE_RATE_SECONDS,
  };
  return rates[stallType];
}

/**
 * @description Applies contextual surge modifiers to a base wait time.
 * Modifiers are applied multiplicatively in the order: density, halftime,
 * then a flat large-queue penalty.
 *
 * @param {number} baseWaitMins - Unadjusted wait time in minutes.
 * @param {DensityLevel} density - Nearby zone density level.
 * @param {Date} timeOfDay - Used to detect half-time window (min 45–59).
 * @param {number} queueLength - Current queue length for flat-penalty check.
 * @returns {number} Adjusted wait time in minutes.
 *
 * @example
 * applySurgeModifiers(10, 'CRITICAL', new Date(), 25)
 * // → Math.ceil(10 × 1.4) + 2 = 16
 */
function applySurgeModifiers(
  baseWaitMins: number,
  density: DensityLevel,
  timeOfDay: Date,
  queueLength: number
): number {
  let waitMins = baseWaitMins;

  if (density === 'CRITICAL') {
    waitMins = Math.ceil(waitMins * QUEUE_RULES.CRITICAL_SURGE_MODIFIER);
  }

  const minutes = timeOfDay.getMinutes();
  if (minutes >= 45 && minutes < 60) {
    waitMins = Math.ceil(waitMins * QUEUE_RULES.HALFTIME_MODIFIER);
  }

  if (queueLength > QUEUE_RULES.LARGE_QUEUE_THRESHOLD) {
    waitMins += QUEUE_RULES.LARGE_QUEUE_FLAT_MINUTES;
  }

  return waitMins;
}
