import type { SystemAlert } from '../types/alert.types';
import type { ZoneDensity } from '../types/crowd.types';
import type { QueueStatus, StallType } from '../types/queue.types';
import type { StaffMember } from '../types/staff.types';
import type { RealtimeAnalytics } from '../types/venue.types';

export const MOCK_VENUE_ID = 'venue-001';
export const VENUE_NAME = 'Grand Arena';
export const VENUE_CAPACITY = 50000;
export const VENUE_CENTER = { lat: 12.9784, lng: 77.6408 };

export type ZoneType = 'ENTRY' | 'CONCOURSE' | 'SEATING' | 'FOOD' | 'EXIT';
export type AlertSeverityCode = 'P0' | 'P1' | 'P2';

export interface VenueZone extends ZoneDensity {
  name: string;
  type: ZoneType;
}

export interface VenueQueue extends QueueStatus {}

export interface VenueAlert extends SystemAlert {
  severityCode: AlertSeverityCode;
}

export interface VenueStaffMember extends StaffMember {}

const minutesAgo = (value: number) => new Date(Date.now() - value * 60_000).toISOString();

export const mockZones: VenueZone[] = [
  { zoneId: 'zone-01', venueId: MOCK_VENUE_ID, name: 'North Entry Gate', type: 'ENTRY', occupancy: 0.85, capacity: 2000, rawCount: 1700, densityLevel: 'HIGH', lastUpdated: minutesAgo(1), sensorConfidence: 0.98 },
  { zoneId: 'zone-02', venueId: MOCK_VENUE_ID, name: 'South Entry Gate', type: 'ENTRY', occupancy: 0.45, capacity: 2000, rawCount: 900, densityLevel: 'LOW', lastUpdated: minutesAgo(1), sensorConfidence: 0.96 },
  { zoneId: 'zone-03', venueId: MOCK_VENUE_ID, name: 'East Entry Gate', type: 'ENTRY', occupancy: 0.62, capacity: 1500, rawCount: 930, densityLevel: 'MEDIUM', lastUpdated: minutesAgo(2), sensorConfidence: 0.94 },
  { zoneId: 'zone-04', venueId: MOCK_VENUE_ID, name: 'West Entry Gate', type: 'ENTRY', occupancy: 0.91, capacity: 1500, rawCount: 1365, densityLevel: 'CRITICAL', lastUpdated: minutesAgo(3), sensorConfidence: 0.97 },
  { zoneId: 'zone-05', venueId: MOCK_VENUE_ID, name: 'North Concourse', type: 'CONCOURSE', occupancy: 0.71, capacity: 5000, rawCount: 3550, densityLevel: 'MEDIUM', lastUpdated: minutesAgo(1), sensorConfidence: 0.95 },
  { zoneId: 'zone-06', venueId: MOCK_VENUE_ID, name: 'South Concourse', type: 'CONCOURSE', occupancy: 0.38, capacity: 5000, rawCount: 1900, densityLevel: 'LOW', lastUpdated: minutesAgo(1), sensorConfidence: 0.93 },
  { zoneId: 'zone-07', venueId: MOCK_VENUE_ID, name: 'Main Seating Bowl', type: 'SEATING', occupancy: 0.96, capacity: 35000, rawCount: 33600, densityLevel: 'HIGH', lastUpdated: minutesAgo(1), sensorConfidence: 0.99 },
  { zoneId: 'zone-08', venueId: MOCK_VENUE_ID, name: 'Food Court A', type: 'FOOD', occupancy: 0.95, capacity: 800, rawCount: 760, densityLevel: 'CRITICAL', lastUpdated: minutesAgo(2), sensorConfidence: 0.92 },
  { zoneId: 'zone-09', venueId: MOCK_VENUE_ID, name: 'Food Court B', type: 'FOOD', occupancy: 0.72, capacity: 800, rawCount: 576, densityLevel: 'MEDIUM', lastUpdated: minutesAgo(1), sensorConfidence: 0.91 },
  { zoneId: 'zone-10', venueId: MOCK_VENUE_ID, name: 'Merchandise Zone', type: 'FOOD', occupancy: 0.41, capacity: 400, rawCount: 164, densityLevel: 'LOW', lastUpdated: minutesAgo(2), sensorConfidence: 0.9 },
  { zoneId: 'zone-11', venueId: MOCK_VENUE_ID, name: 'North Exit', type: 'EXIT', occupancy: 0.88, capacity: 3000, rawCount: 2640, densityLevel: 'HIGH', lastUpdated: minutesAgo(1), sensorConfidence: 0.96 },
  { zoneId: 'zone-12', venueId: MOCK_VENUE_ID, name: 'South Exit', type: 'EXIT', occupancy: 0.23, capacity: 3000, rawCount: 690, densityLevel: 'LOW', lastUpdated: minutesAgo(3), sensorConfidence: 0.89 },
];

export const mockQueues: VenueQueue[] = [
  { queueId: 'q-01', stallId: 'stall-01', stallName: 'Burger Junction', stallType: 'FOOD', currentLength: 24, estimatedWaitMinutes: 22, isOpen: true, lastUpdated: minutesAgo(1) },
  { queueId: 'q-02', stallId: 'stall-02', stallName: 'Pizza Point', stallType: 'FOOD', currentLength: 8, estimatedWaitMinutes: 7, isOpen: true, lastUpdated: minutesAgo(1) },
  { queueId: 'q-03', stallId: 'stall-03', stallName: 'Cold Drinks Bar', stallType: 'DRINKS', currentLength: 15, estimatedWaitMinutes: 12, isOpen: true, lastUpdated: minutesAgo(2) },
  { queueId: 'q-04', stallId: 'stall-04', stallName: 'Tea & Coffee', stallType: 'DRINKS', currentLength: 3, estimatedWaitMinutes: 3, isOpen: true, lastUpdated: minutesAgo(1) },
  { queueId: 'q-05', stallId: 'stall-05', stallName: 'Team Merchandise', stallType: 'MERCHANDISE', currentLength: 6, estimatedWaitMinutes: 8, isOpen: true, lastUpdated: minutesAgo(3) },
  { queueId: 'q-06', stallId: 'stall-06', stallName: 'Snack Corner', stallType: 'FOOD', currentLength: 31, estimatedWaitMinutes: 28, isOpen: true, lastUpdated: minutesAgo(1) },
  { queueId: 'q-07', stallId: 'stall-07', stallName: 'Healthy Bites', stallType: 'FOOD', currentLength: 2, estimatedWaitMinutes: 2, isOpen: true, lastUpdated: minutesAgo(2) },
  { queueId: 'q-08', stallId: 'stall-08', stallName: 'Ice Cream Stand', stallType: 'FOOD', currentLength: 0, estimatedWaitMinutes: 0, isOpen: false, lastUpdated: minutesAgo(6) },
];

export const mockAlerts: VenueAlert[] = [
  { alertId: 'a-01', venueId: MOCK_VENUE_ID, type: 'CROWD_DENSITY', severity: 'CRITICAL', severityCode: 'P0', zoneId: 'zone-08', message: 'Food Court A has exceeded safe capacity limits.', triggeredAt: new Date(Date.now() - 180_000).toISOString(), resolvedAt: undefined },
  { alertId: 'a-02', venueId: MOCK_VENUE_ID, type: 'QUEUE_SURGE', severity: 'HIGH', severityCode: 'P1', zoneId: 'zone-06', message: 'Snack Corner queue exceeding 25 minute threshold.', triggeredAt: new Date(Date.now() - 420_000).toISOString(), resolvedAt: undefined },
  { alertId: 'a-03', venueId: MOCK_VENUE_ID, type: 'CROWD_DENSITY', severity: 'MEDIUM', severityCode: 'P2', zoneId: 'zone-04', message: 'West Entry Gate approaching high density.', triggeredAt: new Date(Date.now() - 600_000).toISOString(), resolvedAt: undefined },
];

export const mockAnalytics: RealtimeAnalytics = {
  totalAttendees: 47832,
  percentCapacity: 0.957,
  criticalZonesCount: 2,
  avgQueueWaitMinutes: 11,
  longestQueueMinutes: 28,
  activeAlertsCount: 3,
  alertsResolvedLastHour: 18,
  notificationsSentToday: 124,
  peakOccupancyToday: 48730,
  peakOccupancyTime: '19:42',
  updatedAt: new Date().toISOString(),
};

export const mockStaff: VenueStaffMember[] = [
  {
    staffId: 'staff-01',
    name: 'Asha Menon',
    role: 'MANAGER',
    active: true,
    assignedZone: 'zone-04',
    location: { lat: 12.9793, lng: 77.6398 },
    lastUpdated: minutesAgo(1),
  },
  {
    staffId: 'staff-02',
    name: 'Ravi Kumar',
    role: 'GUARD',
    active: true,
    assignedZone: 'zone-08',
    location: { lat: 12.9781, lng: 77.6415 },
    lastUpdated: minutesAgo(2),
  },
  {
    staffId: 'staff-03',
    name: 'Neha Shah',
    role: 'EMT',
    active: true,
    assignedZone: 'zone-01',
    location: { lat: 12.9799, lng: 77.6407 },
    lastUpdated: minutesAgo(1),
  },
  {
    staffId: 'staff-04',
    name: 'Imran Sheikh',
    role: 'GUARD',
    active: true,
    assignedZone: 'zone-11',
    location: { lat: 12.9774, lng: 77.6392 },
    lastUpdated: minutesAgo(3),
  },
  {
    staffId: 'staff-05',
    name: 'Priya Nair',
    role: 'VENDOR',
    active: true,
    assignedZone: 'zone-09',
    location: { lat: 12.9787, lng: 77.6421 },
    lastUpdated: minutesAgo(2),
  },
  {
    staffId: 'staff-06',
    name: 'Karan Dsouza',
    role: 'GUARD',
    active: true,
    assignedZone: undefined,
    location: { lat: 12.9779, lng: 77.6411 },
    lastUpdated: minutesAgo(4),
  },
];

export interface ChartPoint {
  label: string;
  occupancy: number;
  attendance: number;
  queue: number;
}

export const zoneNameById = (zoneId?: string | null) => {
  if (!zoneId) return 'Unassigned zone';
  return mockZones.find((zone) => zone.zoneId === zoneId)?.name ?? zoneId;
};

export const severityCodeFromAlert = (alert: Pick<SystemAlert, 'severity'>): AlertSeverityCode => {
  if (alert.severity === 'CRITICAL') return 'P0';
  if (alert.severity === 'HIGH') return 'P1';
  return 'P2';
};

export const severityClasses: Record<AlertSeverityCode, string> = {
  P0: 'border-red-500/30 bg-red-500/15 text-red-200',
  P1: 'border-amber-500/30 bg-amber-500/15 text-amber-200',
  P2: 'border-yellow-500/30 bg-yellow-500/15 text-yellow-200',
};

export const stallTypeLabel = (stallType: StallType) => {
  if (stallType === 'DRINKS') return 'Drinks';
  if (stallType === 'MERCHANDISE') return 'Merch';
  if (stallType === 'RESTROOM') return 'Restroom';
  return 'Food';
};

export const buildDensityHistory = (zone: VenueZone): ChartPoint[] =>
  Array.from({ length: 30 }, (_, index) => {
    const ratio = Math.max(0.12, Math.min(0.99, zone.occupancy - 0.1 + index * 0.006));
    return {
      label: `${index + 1}`,
      occupancy: Number((ratio * 100).toFixed(1)),
      attendance: Math.round(ratio * zone.capacity),
      queue: Math.max(1, Math.round(zone.occupancy * 20) - 5 + (index % 4)),
    };
  });

export const buildAttendanceTrend = (): ChartPoint[] =>
  [
    ['17:00', 0.12, 6000, 2],
    ['17:30', 0.24, 12000, 4],
    ['18:00', 0.38, 19000, 7],
    ['18:30', 0.56, 28000, 10],
    ['19:00', 0.72, 36000, 12],
    ['19:30', 0.86, 43000, 14],
    ['20:00', 0.96, 47832, 11],
    ['20:30', 0.9, 45100, 9],
  ].map(([label, occupancy, attendance, queue]) => ({
    label: String(label),
    occupancy: Number(occupancy) * 100,
    attendance: Number(attendance),
    queue: Number(queue),
  }));
