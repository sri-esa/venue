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
import { PubSub } from '@google-cloud/pubsub';
import { CrowdDensityProcessor, RawSensorReading } from './processor';
import { HealthMonitor } from './health_monitor';
import { createLogger } from '../../shared/logger';
import { FREE_TIER_LIMITS } from '../../shared/constants';

const logger = createLogger('crowd-density-service');
const server = Fastify({ logger: true });
const processor = new CrowdDensityProcessor();
const monitor = new HealthMonitor('venue-001');

const SERVICE_NAME = 'crowd-density-service';
const SERVICE_VERSION = '1.0.0';
/** Estimated Firestore writes per day (1 write/min × 1440 min). */
const ESTIMATED_DAILY_WRITES = 1440;

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

server.post('/density/ingest', async (request, reply) => {
  const result = await processor.ingestSensorReading(request.body as RawSensorReading);
  return result;
});

// ─── Bootstrap ────────────────────────────────────────────────────────────────

const start = async (): Promise<void> => {
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
        const data = JSON.parse(message.data.toString()) as RawSensorReading;
        await processor.ingestSensorReading(data);
        monitor.recordSensorActivity(data.sensorId);
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
