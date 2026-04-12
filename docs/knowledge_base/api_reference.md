# API Reference

This covers the primary endpoints managed across the 4 microservices (Crowd Density, Queue Management, Analytics, Notifications).

## Common Restrictions
- **Auth:** All requests require a `Bearer` token (Google Cloud Identity JWT).
- **Format:** JSON payloads required `Content-Type: application/json`.
- **Rate Limits:** Cloud Armor restricts frontend clients to 100 req/min.

---
## Service 1: Crowd Density (`/density`)
Provides real-time heatmaps and capacities.

### `GET /density/zones?venueId={id}`
Returns all zones and current density %.
```json
{
  "zones": [
    { "id": "zone-05", "capacity": 5000, "current": 4900, "status": "CRITICAL" }
  ]
}
```

---
## Service 2: Queue Management (`/queues`)
Dynamic waiting times using the 215ms KD-Tree interpolation algorithm.

### `GET /queues/nearest?lat={lat}&lng={lng}&type={type}`
Finds the shortest queue dynamically using geospatial proximity + stall backend latency.
```json
{
  "recommended": {
    "stallId": "stall-nw-01",
    "waitTimeMinutes": 2.4,
    "distanceMeters": 40
  }
}
```

---
## Service 3: Analytics / Gemini (`/analytics`)
Handles AI prompting and personalized routing.

### `POST /analytics/ask`
Requires Context Payload. Uses hashed caching.
**Request:**
```json
{
  "prompt": "Where is the closest vegetarian food with no line?",
  "context": { "lat": -33.8, "lng": 151.2 }
}
```
**Response:**
```json
{
  "answer": "Head to North West Grill behind you; the queue is currently 15 minutes shorter than Food Court A.",
  "cacheHit": true
}
```

---
## Service 4: Webhook Integrations
External system hooks (e.g., Ticketmaster scanning signals).

### `POST /webhooks/ticketing/scan`
Validates external system entries into `PRE_EVENT` simulation flows.
```json
{
  "gateId": "gate-1",
  "ticketClass": "VIP",
  "timestamp": "2026-04-09T18:05:00Z"
}
```
