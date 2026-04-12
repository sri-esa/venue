/**
 * @service analytics-service
 * @description Fastify HTTP server and PubSub subscriber for the analytics
 * microservice. Ingests crowd-density and queue events into BigQuery, runs
 * real-time aggregations, and serves AI-generated venue reports via Gemini.
 *
 * @googleServices Cloud Pub/Sub, BigQuery, Gemini API
 * @cloudRun Deployed in us-central1; port resolved from PORT env var (default 8083)
 */
import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { PubSub } from '@google-cloud/pubsub';
import { BigQueryService } from './bigquery';
import { RealtimeAggregator } from './aggregator';
import generateReportRoute from './report_generator';
import { createLogger } from '../../shared/logger';
import { isValidId } from '../../shared/sanitize';

const logger = createLogger('analytics-service');

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

// ─── Bootstrap ────────────────────────────────────────────────────────────────

const start = async (): Promise<void> => {
  const server = Fastify({ logger: true });
  const bqService = new BigQueryService();
  const aggregator = new RealtimeAggregator();

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

  server.register(generateReportRoute);

  server.get('/health', async () => {
    return {
      status: 'ok',
      service: 'analytics-service',
      version: '1.0.0',
      uptime: process.uptime(),
    };
  });

  // ─── PubSub subscriptions ────────────────────────────────────────────────────

  try {
    aggregator.start('venue-001');

    const port = parseInt(process.env.PORT || '8083', 10);
    await server.listen({ port, host: '0.0.0.0' });
    logger.info('start', 'Analytics Service running', { port });

    const pubsub = new PubSub();

    // SECURITY: Validate crowd-density PubSub messages before inserting into BigQuery
    pubsub.subscription('crowd-density-raw-sub').on('message', async (message) => {
      try {
        const data = JSON.parse(message.data.toString()) as Record<string, unknown>;
        if (!isValidId(data.venueId) || !isValidId(data.zoneId)) {
          logger.warn('density-sub.message', 'Dropped invalid density event', {
            venueId: data.venueId,
            zoneId: data.zoneId,
          });
          message.nack();
          return;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await bqService.insertDensityLog(data as any);
        message.ack();
      } catch (err) {
        logger.error('density-sub.message', 'Failed to insert density log', {}, err);
        message.nack();
      }
    });

    // SECURITY: Validate queue PubSub messages before inserting into BigQuery
    pubsub.subscription('queue-events-raw-sub').on('message', async (message) => {
      try {
        const data = JSON.parse(message.data.toString()) as Record<string, unknown>;
        if (!isValidId(data.venueId) || !isValidId(data.queueId)) {
          logger.warn('queue-sub.message', 'Dropped invalid queue event', {
            venueId: data.venueId,
            queueId: data.queueId,
          });
          message.nack();
          return;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await bqService.insertQueueLog(data as any);
        message.ack();
      } catch (err) {
        logger.error('queue-sub.message', 'Failed to insert queue log', {}, err);
        message.nack();
      }
    });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
