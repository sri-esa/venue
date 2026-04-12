/**
 * @service queue-management-service
 * @description Fastify HTTP server and PubSub subscriber for the queue-management
 * microservice. Exposes a `/health` probe and queue CRUD endpoints, and processes
 * queue events from the `queue-events-raw-sub` PubSub subscription.
 *
 * @googleServices Cloud Firestore, Cloud Pub/Sub
 * @cloudRun Deployed in us-central1; port resolved from PORT env var (default 8081)
 * @freeTier Batch writes keep Firestore usage under 20 k writes/day free-tier limit
 */
import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { PubSub } from '@google-cloud/pubsub';
import { QueueProcessor, QueueEvent } from './queue_processor';
import routes from './routes';
import { createLogger } from '../../shared/logger';
import { FREE_TIER_LIMITS, QUEUE_RULES } from '../../shared/constants';
import { sanitizeString, isValidId } from '../../shared/sanitize';

const logger = createLogger('queue-management-service');

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
const SERVICE_NAME = 'queue-management-service';
const SERVICE_VERSION = '1.0.0';
/** Estimated Firestore writes per day (1 write/min × 60 min × rolling). */
const ESTIMATED_DAILY_WRITES = 3600;

// ─── Bootstrap ────────────────────────────────────────────────────────────────

const start = async (): Promise<void> => {
  const server = Fastify({ logger: true });
  const processor = new QueueProcessor();

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

  server.register(async (instance) => {
    await routes(instance, processor);
  });

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

  // ─── PubSub subscription ────────────────────────────────────────────────────

  try {
    const staleCheckIntervalMs = QUEUE_RULES.STALE_QUEUE_MINUTES * 60 * 1000;
    setInterval(() => processor.markStaleData('venue-001'), staleCheckIntervalMs);

    const port = parseInt(process.env.PORT || '8081', 10);
    await server.listen({ port, host: '0.0.0.0' });
    logger.info('start', 'Queue Management Service running', { port });

    const pubsub = new PubSub();
    const subscription = pubsub.subscription('queue-events-raw-sub');
    subscription.on('message', async (message) => {
      try {
        // SECURITY: Validate PubSub message before processing
        const data = JSON.parse(message.data.toString()) as Record<string, unknown>;
        if (!isValidId(data.venueId) || !isValidId(data.queueId)) {
          logger.warn('pubsub.message', 'Dropped invalid PubSub queue event', {
            venueId: data.venueId,
            queueId: data.queueId,
          });
          message.nack();
          return;
        }
        // SECURITY: Sanitize string fields before passing to processor
        const sanitized: QueueEvent = {
          ...(data as unknown as QueueEvent),
          venueId: sanitizeString(data.venueId, 64),
          queueId: sanitizeString(data.queueId, 64),
          stallId: sanitizeString(data.stallId, 64),
          stallName: sanitizeString(data.stallName, 128),
        };
        await processor.processQueueEvent(sanitized);
        message.ack();
      } catch (err) {
        logger.error('pubsub.message', 'Failed to process queue event', {}, err);
        message.nack();
      }
    });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
