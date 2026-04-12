import { Firestore, Settings } from '@google-cloud/firestore';

const settings: Settings = {
  projectId: process.env.PROJECT_ID!,
  // In Cloud Run: uses Application Default Credentials
  // automatically — no service account JSON needed
  // Locally: set GOOGLE_APPLICATION_CREDENTIALS env var
};

export const db = new Firestore(settings);

export interface ZoneDensity {
  zoneId: string;
  occupancy: number;
  capacity: number;
  densityLevel: string;
  rawCount: number;
  lastUpdated: string | number;
  sensorConfidence: number;
  connectedZones?: string[];
  venueId?: string;
}

export interface QueueStatus {
  queueId: string;
  stallId: string;
  stallName: string;
  stallType: string;
  currentLength: number;
  estimatedWaitMinutes: number;
  isOpen: boolean;
  coordinates: number[];
  lastUpdated: number;
  overrideExpiresAt: number | null;
}

export interface SystemAlert {
  alertId: string;
  type: string;
  severity: string;
  zoneId: string;
  message: string;
  triggeredAt: number;
  resolvedAt: number | null;
  assignedTo: string | null;
}

export interface SystemHealthState {
  state: 'HEALTHY' | 'DEGRADED' | 'PARTIAL' | 'CRITICAL';
}

// Helper: write zone density
export async function writeZoneDensity(
  venueId: string,
  zoneId: string,
  data: ZoneDensity
): Promise<void> {
  await db
    .collection('venues')
    .doc(venueId)
    .collection('zones')
    .doc(zoneId)
    .set(data, { merge: true });
}

// Helper: write queue status
export async function writeQueueStatus(
  venueId: string,
  queueId: string,
  data: QueueStatus
): Promise<void> {
  await db
    .collection('venues')
    .doc(venueId)
    .collection('queues')
    .doc(queueId)
    .set(data, { merge: true });
}

// Helper: write alert
export async function writeAlert(
  venueId: string,
  alertId: string,
  data: SystemAlert
): Promise<void> {
  await db
    .collection('venues')
    .doc(venueId)
    .collection('alerts')
    .doc(alertId)
    .set(data);
}

// Helper: batch write all zones (free tier optimization)
export async function batchWriteZones(
  venueId: string,
  zones: ZoneDensity[]
): Promise<void> {
  const batch = db.batch();
  zones.forEach(zone => {
    const ref = db
      .collection('venues')
      .doc(venueId)
      .collection('zones')
      .doc(zone.zoneId);
    batch.set(ref, zone, { merge: true });
  });
  await batch.commit();
}

// Helper: update system health
export async function writeSystemHealth(
  venueId: string,
  state: SystemHealthState
): Promise<void> {
  await db
    .collection('venues')
    .doc(venueId)
    .collection('system_health')
    .doc('current')
    .set({ state, updatedAt: new Date().toISOString() });
}
