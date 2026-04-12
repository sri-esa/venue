// Service: notifications
// Layer: Intelligence Layer
// Implements: Req 7, Phase 2 Architecture Microservice
// Publishes To: Firebase Cloud Messaging (FCM)
// Consumes From: PubSub (fcm-notifications, venue-alerts)
import Fastify from 'fastify';
// Firebase Admin removed; relying on GCP FCMSender over REST
import { FCMSender } from './fcm_sender';
import { PubSub } from '@google-cloud/pubsub';
import { buildFCMMessage, NotificationPayload } from './templates';

const server = Fastify({ logger: true });
const messaging = new FCMSender();

server.get('/health', async () => {
  return { status: 'ok', uptime: process.uptime() };
});

const start = async () => {
  try {
    await server.listen({ port: parseInt(process.env.PORT || '8082', 10), host: '0.0.0.0' });
    console.log('Notifications Service running');
    
    // Subscribe to PubSub
    const pubsub = new PubSub();
    
    const fcmSub = pubsub.subscription('fcm-notifications-sub');
    fcmSub.on('message', async (message) => {
      try {
        const payload: NotificationPayload = JSON.parse(message.data.toString());
        const fcmMessage = buildFCMMessage(payload);
        
        const response = await messaging.sendMessage(fcmMessage);
        console.log(`Successfully sent message:`, response);
        message.ack();
      } catch (err) {
        console.error('Failed to process FCM message', err);
        message.nack();
      }
    });

    const alertSub = pubsub.subscription('venue-alerts-sub');
    alertSub.on('message', async (message) => {
      try {
        // Here we could map generic venue alerts to Staff FCM alerts as well.
        // For now, we ack to acknowledge the receipt.
        message.ack();
      } catch (err) {
        message.nack();
      }
    });

  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
