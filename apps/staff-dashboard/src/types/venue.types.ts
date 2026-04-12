export type HealthState = 'HEALTHY' | 'DEGRADED' | 'PARTIAL' | 'CRITICAL';

export interface RealtimeAnalytics {
  totalAttendees: number;
  percentCapacity: number;
  criticalZonesCount: number;
  avgQueueWaitMinutes: number;
  longestQueueMinutes: number;
  activeAlertsCount: number;
  alertsResolvedLastHour: number;
  notificationsSentToday: number;
  peakOccupancyToday: number;
  peakOccupancyTime: string;
  updatedAt: string;
}

export interface SystemHealth {
  state: HealthState;
  dropRate: number;
  latencyMs: number;
  updatedAt: string;
}
