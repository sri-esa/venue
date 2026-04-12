// Service: queue-management
// Layer: Intelligence Layer
// Implements: Req 2
import { FastifyInstance } from 'fastify';
import { db } from './shared/firestore-client';
import { QueueProcessor, QueueEvent, QueueStatus } from './queue_processor';

export default async function routes(fastify: FastifyInstance, processor: QueueProcessor) {
  
  fastify.post('/queues/update', async (request, reply) => {
    const event = request.body as QueueEvent;
    await processor.processQueueEvent(event);
    return { success: true };
  });

  fastify.get<{ Params: { venueId: string } }>('/queues/:venueId', async (request, reply) => {
    const snap = await db.collection('venues').doc(request.params.venueId).collection('queues').get();
    const queuesMap: Record<string, any> = {};
    snap.forEach(doc => { queuesMap[doc.id] = doc.data(); });
    return queuesMap;
  });

  fastify.get<{ Querystring: { venueId: string; lat: string; lng: string; type?: string; maxWait?: string } }>(
    '/queues/nearest',
    async (request, reply) => {
      const { venueId, lat, lng, type, maxWait } = request.query;
      
      if (!venueId || !lat || !lng) {
        reply.code(400).send({ error: "Missing required query parameters." });
        return;
      }

      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const limitWait = maxWait ? parseInt(maxWait, 10) : 15;

      const snap = await db.collection('venues').doc(venueId).collection('queues').get();
      if (snap.empty) return [];

      let queues: QueueStatus[] = snap.docs.map(doc => doc.data() as QueueStatus);

      // 1. Filter open
      queues = queues.filter(q => q.isOpen);
      
      // 2. Filter maxWait
      queues = queues.filter(q => q.estimatedWaitMinutes <= limitWait);
      
      // 3. Filter type
      if (type) {
        queues = queues.filter(q => q.stallType === type);
      }

      // Calculate distance and sort
      const results = queues.map(q => {
        let distanceMeters = 0;
        let distanceMinutes = 0;
        
        if (q.coordinates) {
          // Haversine approx
          const R = 6371e3; // metres
          const φ1 = userLat * Math.PI/180;
          const φ2 = q.coordinates[0] * Math.PI/180;
          const Δφ = (q.coordinates[0]-userLat) * Math.PI/180;
          const Δλ = (q.coordinates[1]-userLng) * Math.PI/180;

          const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                    Math.cos(φ1) * Math.cos(φ2) *
                    Math.sin(Δλ/2) * Math.sin(Δλ/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          distanceMeters = R * c;
          
          // Walking speed ~ 80 meters per minute
          distanceMinutes = distanceMeters / 80;
        }

        const score = (q.estimatedWaitMinutes * 0.6) + (distanceMinutes * 0.4);
        
        return { ...q, distanceMeters, score };
      });

      results.sort((a, b) => a.score - b.score);
      
      return results.slice(0, 5);
    }
  );
  
  fastify.post('/queues/manual', async (request, reply) => {
    // Staff override logic
    const event = request.body as QueueEvent;
    event.source = 'MANUAL';
    await processor.processQueueEvent(event);
    return { success: true };
  });
}
