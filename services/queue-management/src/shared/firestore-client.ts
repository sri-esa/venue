/**
 * @module firestore-client
 * @description Firestore client singleton and typed write helpers for the
 * crowd-density service. All Firestore operations use Application Default
 * Credentials — no service account JSON required in Cloud Run.
 *
 * SECURITY: All credentials loaded from GCP ADC. No hardcoded values.
 */
import { Firestore, Settings } from '@google-cloud/firestore';
import { FirestoreError } from '../../../shared/errors';

const settings: Settings = {
  projectId: process.env.PROJECT_ID,
  // Cloud Run: uses ADC automatically.
  // Locally: set GOOGLE_APPLICATION_CREDENTIALS env var.
};

export const db = new Firestore(settings);

// ─── Shared document interfaces ───────────────────────────────────────────────

export interface ZoneDensity {
  zoneId: string;
  venueId?: string;
  occupancy: number;
  capacity: number;
  densityLevel: string;
  rawCount: number;
  lastUpdated: string | number;
  sensorConfidence: number;
  connectedZones?: string[];
}

export interface QueueStatus {
  queueId: string;
  stallId: string;
  stallName: string;
  stallType: string;
  currentLength: number;
  estimatedWaitMinutes: number;
  isOpen: boolean;
  coordinates?: [number, number];
  lastUpdated: string | number;
  overrideExpiresAt?: number | null;
}

export interface SystemAlert {
  alertId: string;
  type: string;
  severity: string;
  zoneId: string;
  message: string;
  triggeredAt: string | number;
  resolvedAt: string | number | null;
  assignedTo: string | null;
  venueId?: string;
}

export interface SystemHealthState {
  state: 'HEALTHY' | 'DEGRADED' | 'PARTIAL' | 'CRITICAL';
}

// ─── Write helpers ────────────────────────────────────────────────────────────

/**
 * @description Writes or merges a single zone-density document into
 * `venues/{venueId}/zones/{zoneId}`.
 *
 * @param {string} venueId - Parent venue document ID.
 * @param {string} zoneId - Zone document ID.
 * @param {ZoneDensity} data - Zone density snapshot to persist.
 * @returns {Promise<void>}
 * @throws {FirestoreError} When the Firestore write fails.
 *
 * @example
 * await writeZoneDensity('venue-001', 'zone-03', zoneDensity)
 */
export async function writeZoneDensity(
  venueId: string,
  zoneId: string,
  data: ZoneDensity
): Promise<void> {
  try {
    await db.collection('venues').doc(venueId).collection('zones').doc(zoneId).set(data, { merge: true });
  } catch (err) {
    throw new FirestoreError('writeZoneDensity failed', { venueId, zoneId });
  }
}

/**
 * @description Writes or merges a queue-status document into
 * `venues/{venueId}/queues/{queueId}`.
 *
 * @param {string} venueId - Parent venue document ID.
 * @param {string} queueId - Queue document ID.
 * @param {QueueStatus} data - Queue status snapshot to persist.
 * @returns {Promise<void>}
 * @throws {FirestoreError} When the Firestore write fails.
 *
 * @example
 * await writeQueueStatus('venue-001', 'q-food-01', queueStatus)
 */
export async function writeQueueStatus(
  venueId: string,
  queueId: string,
  data: QueueStatus
): Promise<void> {
  try {
    await db.collection('venues').doc(venueId).collection('queues').doc(queueId).set(data, { merge: true });
  } catch (err) {
    throw new FirestoreError('writeQueueStatus failed', { venueId, queueId });
  }
}

/**
 * @description Creates an alert document in `venues/{venueId}/alerts/{alertId}`.
 * Alert documents are immutable once created; updates go through writeAlert only.
 *
 * @param {string} venueId - Parent venue document ID.
 * @param {string} alertId - Alert document ID (UUID).
 * @param {SystemAlert | Record<string, unknown>} data - Alert payload to persist.
 * @returns {Promise<void>}
 * @throws {FirestoreError} When the Firestore write fails.
 *
 * @example
 * await writeAlert('venue-001', 'alert-uuid', alertPayload)
 */
export async function writeAlert(
  venueId: string,
  alertId: string,
  data: SystemAlert | Record<string, unknown>
): Promise<void> {
  try {
    await db.collection('venues').doc(venueId).collection('alerts').doc(alertId).set(data);
  } catch (err) {
    throw new FirestoreError('writeAlert failed', { venueId, alertId });
  }
}

/**
 * @description Batch-writes multiple zone-density documents in a single Firestore
 * commit, reducing write count to 1 per flush cycle regardless of the number
 * of zones updated. Respects the {@link FREE_TIER_LIMITS.BATCH_SIZE} cap.
 *
 * @param {string} venueId - Parent venue document ID.
 * @param {ZoneDensity[]} zones - Array of zone density snapshots to batch-write.
 * @returns {Promise<void>}
 * @throws {FirestoreError} When the batch commit fails.
 *
 * @example
 * await batchWriteZones('venue-001', [zone1, zone2, zone3])
 */
export async function batchWriteZones(venueId: string, zones: ZoneDensity[]): Promise<void> {
  try {
    const batch = db.batch();
    zones.forEach((zone) => {
      const ref = db.collection('venues').doc(venueId).collection('zones').doc(zone.zoneId);
      batch.set(ref, zone, { merge: true });
    });
    await batch.commit();
  } catch (err) {
    throw new FirestoreError('batchWriteZones failed', { venueId, zoneCount: zones.length });
  }
}

/**
 * @description Writes the current system health state to
 * `venues/{venueId}/system_health/current`.
 *
 * @param {string} venueId - Parent venue document ID.
 * @param {SystemHealthState} state - Health state object to persist.
 * @returns {Promise<void>}
 * @throws {FirestoreError} When the Firestore write fails.
 *
 * @example
 * await writeSystemHealth('venue-001', { state: 'DEGRADED' })
 */
export async function writeSystemHealth(
  venueId: string,
  state: SystemHealthState
): Promise<void> {
  try {
    await db
      .collection('venues')
      .doc(venueId)
      .collection('system_health')
      .doc('current')
      .set({ state, updatedAt: new Date().toISOString() });
  } catch (err) {
    throw new FirestoreError('writeSystemHealth failed', { venueId });
  }
}
