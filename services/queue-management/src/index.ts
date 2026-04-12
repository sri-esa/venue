// Service: queue-management
// Layer: Intelligence Layer
// Implements: Req 2, Phase 2 Architecture Microservice
// Publishes To: RTDB
// Consumes From: PubSub (queue-events-raw)
import Fastify from 'fastify';
// Firebase Admin removed in favor of GCP native default application credentials.
import { PubSub } from '@google-cloud/pubsub';
import { QueueProcessor } from './queue_processor';
import routes from './routes';

const server = Fastify({ logger: true });
const processor = new QueueProcessor();

server.register(async (instance) => {
    await routes(instance, processor);
});

server.get('/health', async () => {
  return { status: 'ok', uptime: process.uptime() };
});

const start = async () => {
  try {
    // Start stale data crob job manually
    setInterval(() => processor.markStaleData('venue-001'), 60000);

    await server.listen({ port: parseInt(process.env.PORT || '8081', 10), host: '0.0.0.0' });
    console.log('Queue Management Service running');
    
    // Subscribe to PubSub
    const pubsub = new PubSub();
    const subscription = pubsub.subscription('queue-events-raw-sub');
    subscription.on('message', async (message) => {
      try {
        const data = JSON.parse(message.data.toString());
        await processor.processQueueEvent(data);
        message.ack();
      } catch (err) {
        console.error('Failed to process queue message', err);
        message.nack();
      }
    });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
