/**
 * @module routes
 * @description Fastify route definitions for the queue-management service.
 * Exposes endpoints to ingest queue events, query venue queue state, find
 * the nearest optimal queue for an attendee, and apply manual staff overrides.
 *
 * Architecture reference: Req 2 — POS Webhooks / staff tools → Firestore
 * queues collection → attendee API.
 */
import { FastifyInstance } from 'fastify';
import { db } from './shared/firestore-client';
import { QueueProcessor, QueueEvent, QueueStatus } from './queue_processor';

/**
 * @description Registers all queue-management HTTP routes onto the provided
 * Fastify instance.
 *
 * @param {FastifyInstance} fastify - The Fastify server instance to register routes on.
 * @param {QueueProcessor} processor - The queue-management business logic processor.
 * @returns {Promise<void>}
 */
export default async function routes(
  fastify: FastifyInstance,
  processor: QueueProcessor
): Promise<void> {

  /**
   * POST /queues/update
   * Ingest a single queue event from a POS webhook or IoT source.
   */
  fastify.post('/queues/update', async (request) => {
    const event = request.body as QueueEvent;
    await processor.processQueueEvent(event);
    return { success: true };
  });

  /**
   * GET /queues/:venueId
   * Returns all queue status documents for the specified venue as a map
   * keyed by queueId.
   */
  fastify.get<{ Params: { venueId: string } }>('/queues/:venueId', async (request) => {
    const snap = await db
      .collection('venues')
      .doc(request.params.venueId)
      .collection('queues')
      .get();

    const queuesMap: Record<string, unknown> = {};
    snap.forEach((doc) => {
      queuesMap[doc.id] = doc.data();
    });
    return queuesMap;
  });

  /**
   * GET /queues/nearest
   * Returns up to 5 open queues ranked by a weighted score of wait time
   * (60 %) and walking distance (40 %).
   *
   * Required query params: venueId, lat, lng
   * Optional query params: type (StallType filter), maxWait (minutes cap, default 15)
   */
  fastify.get<{
    Querystring: {
      venueId: string;
      lat: string;
      lng: string;
      type?: string;
      maxWait?: string;
    };
  }>('/queues/nearest', async (request, reply) => {
    const { venueId, lat, lng, type, maxWait } = request.query;

    if (!venueId || !lat || !lng) {
      reply.code(400).send({ error: 'Missing required query parameters: venueId, lat, lng.' });
      return;
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const limitWait = maxWait ? parseInt(maxWait, 10) : 15;

    const snap = await db.collection('venues').doc(venueId).collection('queues').get();
    if (snap.empty) return [];

    let queues: QueueStatus[] = snap.docs.map((doc) => doc.data() as QueueStatus);

    // Filter: open, within wait cap, and optionally by stall type
    queues = queues.filter((q) => q.isOpen && q.estimatedWaitMinutes <= limitWait);
    if (type) {
      queues = queues.filter((q) => q.stallType === type);
    }

    // Score queues by walking distance and wait time using Haversine distance
    const results = queues.map((q) => {
      const { distanceMeters, distanceMinutes } = computeWalkingDistance(
        userLat, userLng, q.coordinates
      );
      const score = q.estimatedWaitMinutes * 0.6 + distanceMinutes * 0.4;
      return { ...q, distanceMeters, score };
    });

    results.sort((a, b) => a.score - b.score);
    return results.slice(0, 5);
  });

  /**
   * POST /queues/manual
   * Applies a staff manual override to a queue event (sets source to MANUAL).
   */
  fastify.post('/queues/manual', async (request) => {
    const event = request.body as QueueEvent;
    event.source = 'MANUAL';
    await processor.processQueueEvent(event);
    return { success: true };
  });
}

// ─── Private helpers ──────────────────────────────────────────────────────────

/**
 * @description Computes the Haversine great-circle distance between the user
 * and a queue's coordinates, and converts it to a walking-time estimate
 * assuming an average walking speed of 80 m/min.
 *
 * @param {number} userLat - User's latitude in decimal degrees.
 * @param {number} userLng - User's longitude in decimal degrees.
 * @param {[number, number] | undefined} coords - Queue coordinates [lat, lng],
 *   or undefined if not available.
 * @returns {{ distanceMeters: number; distanceMinutes: number }} Distance in
 *   metres and estimated walking time in minutes.
 *
 * @example
 * const { distanceMeters } = computeWalkingDistance(12.97, 77.59, [12.98, 77.60])
 * // distanceMeters: ~1340
 */
function computeWalkingDistance(
  userLat: number,
  userLng: number,
  coords: [number, number] | undefined
): { distanceMeters: number; distanceMinutes: number } {
  if (!coords) return { distanceMeters: 0, distanceMinutes: 0 };

  const R = 6_371_000; // Earth radius in metres
  const φ1 = (userLat * Math.PI) / 180;
  const φ2 = (coords[0] * Math.PI) / 180;
  const Δφ = ((coords[0] - userLat) * Math.PI) / 180;
  const Δλ = ((coords[1] - userLng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distanceMeters = R * c;
  const distanceMinutes = distanceMeters / 80; // walking speed ≈ 80 m/min

  return { distanceMeters, distanceMinutes };
}
