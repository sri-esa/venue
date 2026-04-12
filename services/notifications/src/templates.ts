// Service: notifications
// Layer: Intelligence Layer
// Implements: Req 7


export type NotificationTemplateType = 'CROWD_ALERT_CRITICAL' | 'QUEUE_WAIT_REDUCED' | 'EXIT_COORDINATION' | 'EMERGENCY' | 'STAFF_ALERT';

export interface NotificationPayload {
  templateType: NotificationTemplateType;
  venueId: string;
  zoneId?: string;
  queueId?: string;
  alertId?: string;
  emergencyMessage?: string;
  stallName?: string;
  waitMinutes?: number;
  exitGateName?: string;
  alertMessage?: string;
  zoneName?: string; // Pre-resolved Name
}

export function buildFCMMessage(payload: NotificationPayload): any {
  const zoneName = payload.zoneName || payload.zoneId || 'A nearby area';
  
  switch (payload.templateType) {
    case 'CROWD_ALERT_CRITICAL':
      return {
        topic: `venue-${payload.venueId}-zone-${payload.zoneId}`,
        notification: {
          title: '⚠️ Crowded Area Nearby',
          body: `${zoneName} is very crowded. We suggest using an alternative route.`,
        },
        data: {
          type: 'CROWD_ALERT',
          zoneId: payload.zoneId || '',
          deepLink: '/home/map'
        },
        android: { priority: 'high', ttl: 300 * 1000 }
      };

    case 'QUEUE_WAIT_REDUCED':
      return {
        topic: `venue-${payload.venueId}-attendees`, // Or scoped smaller if implemented
        notification: {
          title: '✅ Queue Just Got Shorter',
          body: `${payload.stallName} wait is now only ${payload.waitMinutes} min. Tap to navigate.`,
        },
        data: {
          type: 'QUEUE_ALERT',
          queueId: payload.queueId || '',
          deepLink: `/home/queues/${payload.queueId}`
        },
        android: { priority: 'normal', ttl: 600 * 1000 }
      };

    case 'EXIT_COORDINATION':
      return {
        topic: `venue-${payload.venueId}-attendees`,
        notification: {
          title: '🚪 Best Exit Route for You',
          body: `${payload.exitGateName} is clear. Exit now for fastest route to transport.`,
        },
        data: {
          type: 'EXIT_ALERT',
          zoneId: payload.zoneId || '',
          deepLink: '/home/map/ar'
        },
        android: { priority: 'high', ttl: 900 * 1000 }
      };

    case 'EMERGENCY':
      return {
        topic: `venue-${payload.venueId}-attendees`,
        notification: {
          title: '🚨 Important Venue Announcement',
          body: payload.emergencyMessage || 'Please follow staff instructions.',
        },
        data: {
          type: 'EMERGENCY',
          deepLink: '/home/alerts'
        },
        android: { 
          priority: 'high',
          notification: { visibility: 'public' }
        },
        apns: { payload: { aps: { criticalSound: { critical: true, name: 'default', volume: 1.0 } } } }
      };

    case 'STAFF_ALERT':
      return {
        topic: `staff-zone-${payload.zoneId}`,
        notification: {
          title: `📋 Action Required: ${zoneName}`,
          body: payload.alertMessage || 'Please check dashboard.',
        },
        data: {
          type: 'STAFF_ALERT',
          alertId: payload.alertId || '',
          zoneId: payload.zoneId || '',
          deepLink: '/staff/alerts'
        },
        android: { priority: 'high' }
      };

    default:
      throw new Error(`Unknown template type: ${payload.templateType}`);
  }
}
