// Service: analytics
// Layer: Intelligence Layer
// Implements: Req 10, Phase 2 Architecture Microservice
// Publishes To: BigQuery, RTDB (realtime stats), Firestore (reports)
// Consumes From: PubSub (all topics)
import Fastify from 'fastify';
// Firebase Admin replaced with direct IAM GCP Native Auth
import { PubSub } from '@google-cloud/pubsub';
import { BigQueryService } from './bigquery';
import { RealtimeAggregator } from './aggregator';
import generateReportRoute from './report_generator';

const server = Fastify({ logger: true });
const bqService = new BigQueryService();
const aggregator = new RealtimeAggregator();

server.register(generateReportRoute);

server.get('/health', async () => {
  return { status: 'ok', uptime: process.uptime() };
});

const start = async () => {
  try {
    // bqService.initSchemas(); // Un-comment when true emulators are connected
    aggregator.start('venue-001');

    await server.listen({ port: parseInt(process.env.PORT || '8083', 10), host: '0.0.0.0' });
    console.log('Analytics Service running');
    
    // Subscribe to PubSub
    const pubsub = new PubSub();
    
    pubsub.subscription('crowd-density-raw-sub').on('message', async (message) => {
        try {
            await bqService.insertDensityLog(JSON.parse(message.data.toString()));
            message.ack();
        } catch(e) { message.nack(); }
    });

    pubsub.subscription('queue-events-raw-sub').on('message', async (message) => {
        try {
            await bqService.insertQueueLog(JSON.parse(message.data.toString()));
            message.ack();
        } catch(e) { message.nack(); }
    });

  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
