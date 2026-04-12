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
import { PubSub } from '@google-cloud/pubsub';
import { QueueProcessor, QueueEvent } from './queue_processor';
import routes from './routes';
import { createLogger } from '../../shared/logger';
import { FREE_TIER_LIMITS, QUEUE_RULES } from '../../shared/constants';

const logger = createLogger('queue-management-service');
const server = Fastify({ logger: true });
const processor = new QueueProcessor();

const SERVICE_NAME = 'queue-management-service';
const SERVICE_VERSION = '1.0.0';
/** Estimated Firestore writes per day (1 write/min × 60 min × rolling). */
const ESTIMATED_DAILY_WRITES = 3600;

// ─── Routes ───────────────────────────────────────────────────────────────────

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

// ─── Bootstrap ────────────────────────────────────────────────────────────────

const start = async (): Promise<void> => {
  try {
    // Run stale-data cleanup every STALE_QUEUE_MINUTES on a rolling interval
    const staleCheckIntervalMs = QUEUE_RULES.STALE_QUEUE_MINUTES * 60 * 1000;
    setInterval(() => processor.markStaleData('venue-001'), staleCheckIntervalMs);

    const port = parseInt(process.env.PORT || '8081', 10);
    await server.listen({ port, host: '0.0.0.0' });
    logger.info('start', 'Queue Management Service running', { port });

    const pubsub = new PubSub();
    const subscription = pubsub.subscription('queue-events-raw-sub');
    subscription.on('message', async (message) => {
      try {
        const data = JSON.parse(message.data.toString()) as QueueEvent;
        await processor.processQueueEvent(data);
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
