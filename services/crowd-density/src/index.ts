// Service: crowd-density
// Layer: Intelligence Layer
// Implements: Req 1, Phase 2 Architecture Microservice
// Publishes To: RTDB
// Consumes From: PubSub (crowd-density-raw)
import Fastify from 'fastify';
// Firebase Admin removed in favor of direct GCP Native integration
// and Application Default Credentials within Cloud Run
import { PubSub } from '@google-cloud/pubsub';
import { CrowdDensityProcessor } from './processor';
import { HealthMonitor } from './health_monitor';

const server = Fastify({ logger: true });
const processor = new CrowdDensityProcessor();
const monitor = new HealthMonitor('venue-001');

server.get('/health', async () => {
  return { status: 'ok', uptime: process.uptime() };
});

server.post('/density/ingest', async (request, reply) => {
  const result = await processor.ingestSensorReading(request.body as any);
  return result;
});

const start = async () => {
  try {
    monitor.start();
    await server.listen({ port: parseInt(process.env.PORT || '8080', 10), host: '0.0.0.0' });
    console.log('Crowd Density Service running');
    
    // Subscribe to PubSub
    const pubsub = new PubSub();
    if (process.env.PUBSUB_EMULATOR_HOST) {
      console.log(`Using emulator ${process.env.PUBSUB_EMULATOR_HOST}`);
    }
    const subscription = pubsub.subscription('crowd-density-raw-sub');
    subscription.on('message', async (message) => {
      try {
        const data = JSON.parse(message.data.toString());
        await processor.ingestSensorReading(data);
        monitor.recordSensorActivity(data.sensorId);
        message.ack();
      } catch (err) {
        console.error('Failed to process message', err);
        message.nack();
      }
    });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
