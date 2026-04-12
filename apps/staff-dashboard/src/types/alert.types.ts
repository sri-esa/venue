export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type AlertType = 'CROWD_DENSITY' | 'QUEUE_SURGE' | 'EMERGENCY' | 'STAFF_ALERT';

export interface SystemAlert {
  alertId: string;
  venueId: string;
  zoneId?: string;
  queueId?: string;
  severity: AlertSeverity;
  type: AlertType;
  message: string;
  triggeredAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}
