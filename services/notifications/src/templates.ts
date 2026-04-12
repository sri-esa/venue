/**
 * @module templates
 * @description FCM V1 message template builders for the notifications service.
 * Each template type maps a structured NotificationPayload to a typed FCMMessage.
 */
import { FCMMessage } from './fcm_sender';
import { ValidationError } from '../../shared/errors';

// ─── Public types ─────────────────────────────────────────────────────────────

export type NotificationTemplateType =
  | 'CROWD_ALERT_CRITICAL'
  | 'QUEUE_WAIT_REDUCED'
  | 'EXIT_COORDINATION'
  | 'EMERGENCY'
  | 'STAFF_ALERT';

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
  /** Pre-resolved display name for the zone (fallback: zoneId). */
  zoneName?: string;
}

// ─── Template dispatcher ──────────────────────────────────────────────────────

/**
 * @description Dispatches a NotificationPayload to the appropriate FCM
 * message builder and returns a typed FCMMessage ready to send.
 *
 * @param {NotificationPayload} payload - Decoded PubSub notification payload.
 * @returns {FCMMessage} Typed FCM V1 message for the given template type.
 * @throws {ValidationError} When `payload.templateType` is not recognised.
 *
 * @example
 * const msg = buildFCMMessage({ templateType: 'EMERGENCY', venueId: 'v1', emergencyMessage: 'Evacuate' })
 * // msg: { topic: 'venue-v1-attendees', notification: { title: '🚨 ...' }, ... }
 */
export function buildFCMMessage(payload: NotificationPayload): FCMMessage {
  switch (payload.templateType) {
    case 'CROWD_ALERT_CRITICAL':
      return buildCrowdAlertCritical(payload);
    case 'QUEUE_WAIT_REDUCED':
      return buildQueueWaitReduced(payload);
    case 'EXIT_COORDINATION':
      return buildExitCoordination(payload);
    case 'EMERGENCY':
      return buildEmergency(payload);
    case 'STAFF_ALERT':
      return buildStaffAlert(payload);
    default:
      throw new ValidationError(
        `Unknown notification template type: ${String(payload.templateType)}`,
        { templateType: payload.templateType }
      );
  }
}

// ─── Individual template builders ────────────────────────────────────────────

/**
 * @description Builds an FCM message for a CRITICAL crowd-density alert.
 * Sent to the zone-scoped attendee topic with high priority and a 5-minute TTL.
 * @param {NotificationPayload} p - Payload with venueId and zoneId.
 * @returns {FCMMessage} High-priority crowd alert message.
 */
function buildCrowdAlertCritical(p: NotificationPayload): FCMMessage {
  const zoneName = p.zoneName ?? p.zoneId ?? 'A nearby area';
  return {
    topic: `venue-${p.venueId}-zone-${p.zoneId}`,
    notification: {
      title: '⚠️ Crowded Area Nearby',
      body: `${zoneName} is very crowded. We suggest using an alternative route.`,
    },
    data: {
      type: 'CROWD_ALERT',
      zoneId: p.zoneId ?? '',
      deepLink: '/home/map',
    },
    android: { priority: 'high', ttl: 300 * 1000 },
  };
}

/**
 * @description Builds an FCM message for a queue that just became shorter.
 * Sent to the venue-wide attendee topic with normal priority and a 10-minute TTL.
 * @param {NotificationPayload} p - Payload with stallName and waitMinutes.
 * @returns {FCMMessage} Queue improvement notification.
 */
function buildQueueWaitReduced(p: NotificationPayload): FCMMessage {
  return {
    topic: `venue-${p.venueId}-attendees`,
    notification: {
      title: '✅ Queue Just Got Shorter',
      body: `${p.stallName} wait is now only ${p.waitMinutes} min. Tap to navigate.`,
    },
    data: {
      type: 'QUEUE_ALERT',
      queueId: p.queueId ?? '',
      deepLink: `/home/queues/${p.queueId}`,
    },
    android: { priority: 'normal', ttl: 600 * 1000 },
  };
}

/**
 * @description Builds an FCM message for an exit coordination nudge.
 * Sent to the venue-wide attendee topic with high priority and a 15-minute TTL.
 * @param {NotificationPayload} p - Payload with exitGateName and zoneId.
 * @returns {FCMMessage} Exit route suggestion message.
 */
function buildExitCoordination(p: NotificationPayload): FCMMessage {
  return {
    topic: `venue-${p.venueId}-attendees`,
    notification: {
      title: '🚪 Best Exit Route for You',
      body: `${p.exitGateName} is clear. Exit now for fastest route to transport.`,
    },
    data: {
      type: 'EXIT_ALERT',
      zoneId: p.zoneId ?? '',
      deepLink: '/home/map/ar',
    },
    android: { priority: 'high', ttl: 900 * 1000 },
  };
}

/**
 * @description Builds an FCM message for a venue emergency announcement.
 * Uses critical APNs sound and high Android notification visibility.
 * @param {NotificationPayload} p - Payload with emergencyMessage.
 * @returns {FCMMessage} Emergency announcement message.
 */
function buildEmergency(p: NotificationPayload): FCMMessage {
  return {
    topic: `venue-${p.venueId}-attendees`,
    notification: {
      title: '🚨 Important Venue Announcement',
      body: p.emergencyMessage ?? 'Please follow staff instructions.',
    },
    data: {
      type: 'EMERGENCY',
      deepLink: '/home/alerts',
    },
    android: {
      priority: 'high',
      notification: { visibility: 'public' },
    },
    apns: {
      payload: {
        aps: {
          criticalSound: { critical: true, name: 'default', volume: 1.0 },
        },
      },
    },
  };
}

/**
 * @description Builds an FCM message for a staff operational alert.
 * Sent to the zone-scoped staff topic so only relevant staff receive it.
 * @param {NotificationPayload} p - Payload with alertMessage, zoneId, alertId.
 * @returns {FCMMessage} Staff action-required notification.
 */
function buildStaffAlert(p: NotificationPayload): FCMMessage {
  const zoneName = p.zoneName ?? p.zoneId ?? 'Unknown Zone';
  return {
    topic: `staff-zone-${p.zoneId}`,
    notification: {
      title: `📋 Action Required: ${zoneName}`,
      body: p.alertMessage ?? 'Please check dashboard.',
    },
    data: {
      type: 'STAFF_ALERT',
      alertId: p.alertId ?? '',
      zoneId: p.zoneId ?? '',
      deepLink: '/staff/alerts',
    },
    android: { priority: 'high' },
  };
}
