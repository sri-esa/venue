/**
 * @service crowd-density-service
 * @description Fastify HTTP server and PubSub subscriber for the crowd-density
 * microservice. Exposes a `/health` probe and a `/density/ingest` endpoint,
 * and processes IoT sensor readings from the `crowd-density-raw-sub` PubSub
 * subscription.
 *
 * @googleServices Cloud Firestore, Cloud Pub/Sub
 * @cloudRun Deployed in us-central1; port resolved from PORT env var (default 8080)
 * @freeTier Batch writes keep Firestore usage under 20 k writes/day free-tier limit
 */
import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { PubSub } from '@google-cloud/pubsub';
import { CrowdDensityProcessor, RawSensorReading } from './processor';
import { HealthMonitor } from './health_monitor';
import { createLogger } from '../../shared/logger';
import { FREE_TIER_LIMITS } from '../../shared/constants';
import {
  sanitizeString,
  isValidId,
  isValidOccupancy,
  isValidConfidence,
  isValidTimestamp,
} from '../../shared/sanitize';

const logger = createLogger('crowd-density-service');

// ─── CHANGE 3: Environment validation (fail-fast before any init) ─────────────
// SECURITY: Refuse to start if required environment variables are missing.
// This prevents silent misconfiguration in Cloud Run deployments.
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
const SERVICE_NAME = 'crowd-density-service';
const SERVICE_VERSION = '1.0.0';
/** Estimated Firestore writes per day (1 write/min × 1440 min). */
const ESTIMATED_DAILY_WRITES = 1440;

// ─── Bootstrap ────────────────────────────────────────────────────────────────

const start = async (): Promise<void> => {
  const server = Fastify({ logger: true });
  const processor = new CrowdDensityProcessor();
  const monitor = new HealthMonitor('venue-001');

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

  // ─── CHANGE 5: Input validation + sanitization on ingest endpoint ───────────
  server.post('/density/ingest', async (request, reply) => {
    // SECURITY: Cast to Record so we can safely inspect each field before trusting it
    const body = request.body as Record<string, unknown>;

    // SECURITY: Validate zoneId format — only alphanumeric, dash, underscore (1–64 chars)
    if (!isValidId(body.zoneId)) {
      return reply.status(400).send({ error: 'Invalid zoneId format', code: 'VALIDATION_ERROR' });
    }

    // SECURITY: Validate venueId with the same allowlist pattern
    if (!isValidId(body.venueId)) {
      return reply.status(400).send({ error: 'Invalid venueId format', code: 'VALIDATION_ERROR' });
    }

    // SECURITY: Validate occupancy is a finite number in [0.0, 2.0]
    if (!isValidOccupancy(body.occupancy)) {
      return reply
        .status(400)
        .send({ error: 'Occupancy must be between 0 and 2.0', code: 'VALIDATION_ERROR' });
    }

    // SECURITY: Validate confidence is a finite number in [0.0, 1.0]
    if (!isValidConfidence(body.confidence)) {
      return reply
        .status(400)
        .send({ error: 'Confidence must be between 0 and 1.0', code: 'VALIDATION_ERROR' });
    }

    // SECURITY: Validate timestamp is a recent ISO 8601 string (replay-attack guard)
    if (body.timestamp !== undefined && !isValidTimestamp(body.timestamp)) {
      return reply
        .status(400)
        .send({ error: 'Invalid or future-dated timestamp', code: 'VALIDATION_ERROR' });
    }

    // SECURITY: Sanitize string fields before passing to processor
    const sanitizedReading: RawSensorReading = {
      ...(body as unknown as RawSensorReading),
      zoneId: sanitizeString(body.zoneId, 64),
      venueId: sanitizeString(body.venueId, 64),
      sensorId: sanitizeString(body.sensorId, 64),
    };

    const result = await processor.ingestSensorReading(sanitizedReading);
    return result;
  });

  // ─── PubSub subscription ────────────────────────────────────────────────────

  try {
    monitor.start();
    const port = parseInt(process.env.PORT || '8080', 10);
    await server.listen({ port, host: '0.0.0.0' });
    logger.info('start', 'Crowd Density Service running', { port });

    const pubsub = new PubSub();
    if (process.env.PUBSUB_EMULATOR_HOST) {
      logger.info('start', 'Using PubSub emulator', { host: process.env.PUBSUB_EMULATOR_HOST });
    }

    const subscription = pubsub.subscription('crowd-density-raw-sub');
    subscription.on('message', async (message) => {
      try {
        // SECURITY: PubSub messages are also validated before processing
        const data = JSON.parse(message.data.toString()) as Record<string, unknown>;
        if (!isValidId(data.zoneId) || !isValidId(data.venueId)) {
          logger.warn('pubsub.message', 'Dropped invalid PubSub message', {
            zoneId: data.zoneId,
            venueId: data.venueId,
          });
          message.nack();
          return;
        }
        await processor.ingestSensorReading(data as unknown as RawSensorReading);
        monitor.recordSensorActivity(data.sensorId as string);
        message.ack();
      } catch (err) {
        logger.error('pubsub.message', 'Failed to process sensor reading', {}, err);
        message.nack();
      }
    });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
