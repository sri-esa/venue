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
import rateLimit from '@fastify/rate-limit';
import { PubSub } from '@google-cloud/pubsub';
import { FCMSender } from './fcm_sender';
import { buildFCMMessage, NotificationPayload } from './templates';
import { createLogger } from '../../shared/logger';
import { FREE_TIER_LIMITS } from '../../shared/constants';
import { isValidId } from '../../shared/sanitize';

const logger = createLogger('notifications-service');

// ─── CHANGE 3: Environment validation (fail-fast before any init) ─────────────
// SECURITY: Refuse to start if required environment variables are missing.
const REQUIRED_ENV = ['PROJECT_ID'];

function validateEnvironment(): void {
  const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    logger.error('validateEnvironment', 'Missing required environment variables', { missing });
    process.exit(1);
  }
}

validateEnvironment();

// ─── Service constants ────────────────────────────────────────────────────────
const SERVICE_NAME = 'notifications-service';
const SERVICE_VERSION = '1.0.0';
/** Estimated Firestore writes per day (health probes + alert records). */
const ESTIMATED_DAILY_WRITES = 240;

// ─── Bootstrap ────────────────────────────────────────────────────────────────

const start = async (): Promise<void> => {
  const server = Fastify({ logger: true });
  const messaging = new FCMSender();

  // ─── CHANGE 1: Rate limiting ──────────────────────────────────────────────
  // SECURITY: Limits each IP to 100 requests per minute to prevent DoS/abuse.
  await server.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      error: 'Too many requests',
      code: 'RATE_LIMITED',
      retryAfter: 60,
    }),
  });

  // ─── CHANGE 2: OWASP security headers ──────────────────────────────────────
  // SECURITY: Add defensive HTTP headers to every response.
  server.addHook('onSend', async (_request, reply) => {
    // SECURITY: Prevent MIME-type sniffing attacks
    reply.header('X-Content-Type-Options', 'nosniff');
    // SECURITY: Prevent clickjacking via iframe embedding
    reply.header('X-Frame-Options', 'DENY');
    // SECURITY: Legacy XSS filter for older browsers
    reply.header('X-XSS-Protection', '1; mode=block');
    // SECURITY: Enforce HTTPS for 1 year, including subdomains
    reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    // SECURITY: Do not send Referer header for cross-origin requests
    reply.header('Referrer-Policy', 'no-referrer');
    // SECURITY: Disable access to sensitive browser APIs not needed by this service
    reply.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  });

  // ─── Routes ────────────────────────────────────────────────────────────────

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

  // ─── PubSub subscriptions ────────────────────────────────────────────────────

  try {
    const port = parseInt(process.env.PORT || '8082', 10);
    await server.listen({ port, host: '0.0.0.0' });
    logger.info('start', 'Notifications Service running', { port });

    const pubsub = new PubSub();

    // SECURITY: Validate PubSub payloads before building FCM messages
    const fcmSub = pubsub.subscription('fcm-notifications-sub');
    fcmSub.on('message', async (message) => {
      try {
        const payload = JSON.parse(message.data.toString()) as NotificationPayload;
        // SECURITY: Ensure venueId is present and valid before dispatching
        if (!isValidId(payload.venueId)) {
          logger.warn('fcmSub.message', 'Dropped FCM message with invalid venueId', {
            venueId: payload.venueId,
          });
          message.nack();
          return;
        }
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
