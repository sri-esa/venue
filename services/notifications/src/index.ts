/**
 * @service notifications-service
 * @description Fastify HTTP server and PubSub subscriber for the notifications
 * microservice. Subscribes to `fcm-notifications-sub` and `venue-alerts-sub`,
 * translates payloads into FCM V1 messages, and delivers them via FCMSender.
 *
 * @googleServices Cloud Pub/Sub, GCP Identity Platform (ADC for FCM)
 * @cloudRun Deployed in us-central1; port resolved from PORT env var (default 8082)
 * @freeTier FCM sends are free for all volume on the free tier
 */
import Fastify from 'fastify';
import { PubSub } from '@google-cloud/pubsub';
import { FCMSender } from './fcm_sender';
import { buildFCMMessage, NotificationPayload } from './templates';
import { createLogger } from '../../shared/logger';
import { FREE_TIER_LIMITS } from '../../shared/constants';

const logger = createLogger('notifications-service');
const server = Fastify({ logger: true });
const messaging = new FCMSender();

const SERVICE_NAME = 'notifications-service';
const SERVICE_VERSION = '1.0.0';
/** Estimated Firestore writes per day (health probes + alert records). */
const ESTIMATED_DAILY_WRITES = 240;

// ─── Routes ───────────────────────────────────────────────────────────────────

server.get('/health', async () => {
  const percentUsed = (
    (ESTIMATED_DAILY_WRITES / FREE_TIER_LIMITS.FIRESTORE_DAILY_WRITES) * 100
  ).toFixed(1);
  return {
    status: 'ok',
    service: SERVICE_NAME,
    version: SERVICE_VERSION,
    uptime: process.uptime(),
    freeTierUsage: {
      estimatedDailyWrites: ESTIMATED_DAILY_WRITES,
      dailyWriteLimit: FREE_TIER_LIMITS.FIRESTORE_DAILY_WRITES,
      percentUsed: `${percentUsed}%`,
    },
  };
});

// ─── Bootstrap ────────────────────────────────────────────────────────────────

const start = async (): Promise<void> => {
  try {
    const port = parseInt(process.env.PORT || '8082', 10);
    await server.listen({ port, host: '0.0.0.0' });
    logger.info('start', 'Notifications Service running', { port });

    const pubsub = new PubSub();

    // Process FCM notification requests
    const fcmSub = pubsub.subscription('fcm-notifications-sub');
    fcmSub.on('message', async (message) => {
      try {
        const payload = JSON.parse(message.data.toString()) as NotificationPayload;
        const fcmMessage = buildFCMMessage(payload);
        const response = await messaging.sendMessage(fcmMessage);
        logger.info('fcmSub.message', 'FCM message sent', {
          name: response.name,
          templateType: payload.templateType,
        });
        message.ack();
      } catch (err) {
        logger.error('fcmSub.message', 'Failed to process FCM message', {}, err);
        message.nack();
      }
    });

    // Venue alert consumer — ack only (downstream analytics handles enrichment)
    const alertSub = pubsub.subscription('venue-alerts-sub');
    alertSub.on('message', async (message) => {
      try {
        message.ack();
      } catch (err) {
        logger.error('alertSub.message', 'Failed to acknowledge venue alert', {}, err);
        message.nack();
      }
    });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
