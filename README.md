# Smart Venue Management System

> **Crowgy** — Real-time crowd intelligence, queue monitoring, and operations tooling for large-capacity sports events (50 000+ attendees).

---

## Overview

This monorepo powers a smart sports venue platform that processes live IoT sensor readings, estimates queue wait times, delivers push notifications to attendees and staff, and surfaces actionable insights via a React operations dashboard — all within the GCP free tier for a 50 000-seat stadium event.

The system is composed of three backend Cloud Run microservices, a Flutter attendee app, a React staff dashboard, and shared TypeScript infrastructure libraries.

---

## Architecture

```text
┌─────────────────────────────────────────────────────────────────────┐
│                        Event Day Data Flow                          │
│                                                                     │
│  IoT Sensors (12 zones)                                             │
│       │                                                             │
│       ▼                                                             │
│  PubSub: crowd-density-raw ──► crowd-density Service (Cloud Run)    │
│                                      │  EWMA smoothing             │
│                                      │  Hysteresis classification  │
│                                      ▼                              │
│                               Firestore: /venues/{id}/zones         │
│                                      │                              │
│                                      ▼                              │
│                               PubSub: venue-alerts                  │
│                                      │                              │
│  POS Webhooks ──────────────────►    │                              │
│  PubSub: queue-events-raw ──► queue-management Service (Cloud Run)  │
│                                      │  Wait time estimates        │
│                                      │  Surge detection            │
│                                      ▼                              │
│                               Firestore: /venues/{id}/queues        │
│                                                                     │
│  PubSub: fcm-notifications ──► notifications Service (Cloud Run)    │
│                                      │  FCM V1 REST API            │
│                                      ▼                              │
│                          Attendee phones + Staff devices            │
│                                                                     │
│  Staff Dashboard (React, Cloud Run) ◄── Firestore real-time        │
│  Attendee App (Flutter) ◄──────────── Firestore + FCM              │
└─────────────────────────────────────────────────────────────────────┘
```

### Google services used

| Service | Purpose |
|---------|---------|
| **Cloud Run** | Hosts all backend microservices and the staff dashboard |
| **Cloud Firestore** | Primary real-time database (zones, queues, alerts) |
| **Cloud Pub/Sub** | Event bus between IoT sensors and microservices |
| **Firebase Cloud Messaging** | Push notifications to attendee and staff devices |
| **Cloud Build** | CI/CD image builds triggered from source |
| **Container Registry (gcr.io)** | Docker image storage |
| **Google Maps Platform** | Venue navigation in the attendee app |
| **Gemini API** | AI-powered insights in the analytics service |
| **BigQuery** | Post-event analytics and reporting |

---

## Repository structure

```text
crowd-management/
├── apps/
│   ├── attendee-app/          # Flutter mobile app (AR navigation, push notifications)
│   └── staff-dashboard/        # React operations dashboard (Crowgy)
├── credentials/                # Service account files (never committed to git)
├── docs/                       # Architecture and phase documents
├── infrastructure/
│   └── firestore/              # Firestore security rules
├── iot/                        # IoT device simulation scripts
├── scripts/
│   ├── deploy-cloud-run.sh    # Multi-service Cloud Run deployment
│   └── run-emulators.sh       # Local Firestore + Pub/Sub emulators
├── services/
│   ├── shared/                 # Cross-service TypeScript libraries
│   │   ├── constants.ts        # All numeric thresholds and config (no magic numbers)
│   │   ├── errors.ts           # Typed error hierarchy (VenueSystemError etc.)
│   │   └── logger.ts           # Structured JSON logger (Cloud Logging compatible)
│   ├── crowd-density/          # Zone occupancy processing
│   ├── queue-management/       # Queue wait time estimation + surge detection
│   ├── notifications/          # FCM V1 push delivery
│   └── analytics/              # BigQuery + Gemini insights
├── shared/                     # Shared TypeScript type definitions
└── tests/                      # Simulation and integration test suites
```

---

## Quick start

### Prerequisites

- Node.js ≥ 20
- `gcloud` CLI authenticated (`gcloud auth login`)
- Flutter SDK ≥ 3 (attendee app only)

### Local development — backend services

```bash
# Start Firestore + Pub/Sub emulators
bash scripts/run-emulators.sh

# In separate terminals, start each service:
cd services/crowd-density   && npm install && npm run dev
cd services/queue-management && npm install && npm run dev
cd services/notifications    && npm install && npm run dev
```

### Local development — staff dashboard

```bash
cd apps/staff-dashboard
npm install
npm run dev        # → http://localhost:5173
npm run typecheck  # TypeScript strict check
npm run build      # Production build
```

### Local development — attendee app

```bash
cd apps/attendee-app
flutter pub get
flutter run
```

---

## Services

| Service | Default Port | Responsibility |
|---------|-------------|----------------|
| `crowd-density` | 8080 | IoT sensor ingestion, EWMA smoothing, density classification, alert firing |
| `queue-management` | 8081 | Queue wait-time estimates, surge detection, nearest-queue routing |
| `notifications` | 8082 | FCM V1 push delivery to attendees and staff |
| `analytics` | 8080 | BigQuery event logging, Gemini AI insights |

---

## Deployment

```bash
# Deploy all backend services to Cloud Run
# (uses Cloud Build — no local Docker required)
bash scripts/deploy-cloud-run.sh

# Deploy a single service
bash scripts/deploy-cloud-run.sh crowd-density

# Deploy the staff dashboard
cd apps/staff-dashboard
gcloud builds submit --config cloudbuild.yaml
```

---

## Environment variables

All services read configuration from environment variables. Set these in Cloud Run or in a local `.env` file.

### Required — all backend services

| Variable | Description |
|----------|-------------|
| `PROJECT_ID` | GCP project ID (`crowd-management-system-492802`) |
| `NODE_ENV` | `production` / `development` |
| `PORT` | HTTP port (defaults: 8080 / 8081 / 8082) |

### Optional — backend services

| Variable | Default | Description |
|----------|---------|-------------|
| `PUBSUB_EMULATOR_HOST` | _(unset)_ | Set to `localhost:8085` for local emulator |
| `FLUSH_INTERVAL_MS` | `500` | Batch writer flush cadence |
| `THRESHOLD_MEDIUM` | `0.50` | Crowd density medium threshold |
| `THRESHOLD_HIGH` | `0.75` | Crowd density high threshold |
| `THRESHOLD_CRITICAL` | `0.90` | Crowd density critical threshold |

### Required — staff dashboard (`apps/staff-dashboard/.env.local`)

| Variable | Description |
|----------|-------------|
| `VITE_GCP_API_KEY` | Google Cloud API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |

---

## API reference

### `crowd-density` service

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health probe: returns uptime + free-tier write usage |
| `POST` | `/density/ingest` | Ingest a raw sensor reading |

**POST `/density/ingest` request body:**
```json
{
  "sensorId": "sensor-zone-03-a",
  "zoneId": "zone-03",
  "venueId": "venue-001",
  "timestamp": "2024-01-01T19:30:00.000Z",
  "rawCount": 412,
  "capacity": 500,
  "occupancy": 0.824,
  "confidence": 0.95,
  "sensorType": "infrared"
}
```

### `queue-management` service

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health probe |
| `POST` | `/queues/update` | Ingest a queue event from POS or IoT |
| `GET` | `/queues/:venueId` | All queue statuses for a venue |
| `GET` | `/queues/nearest?venueId=&lat=&lng=&type=&maxWait=` | Nearest open queue by score |
| `POST` | `/queues/manual` | Staff manual override (sets source=MANUAL) |

### `notifications` service

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health probe |

Notification delivery is event-driven via PubSub subscription `fcm-notifications-sub`.

Template types: `CROWD_ALERT_CRITICAL` · `QUEUE_WAIT_REDUCED` · `EXIT_COORDINATION` · `EMERGENCY` · `STAFF_ALERT`

---

## Shared libraries (`services/shared/`)

| Module | Purpose |
|--------|---------|
| `constants.ts` | All numeric thresholds, free-tier limits, cache TTLs, and rule values — no magic numbers in service code |
| `errors.ts` | Typed error hierarchy: `VenueSystemError` → `ValidationError`, `FirestoreError`, `SensorError`, `NotificationError` |
| `logger.ts` | Structured JSON logger (`createLogger(serviceName)`) — all output is Cloud Logging–compatible |

---

## Free-tier usage

The system is architected to stay within the GCP always-free tier for a typical match-day event.

| Resource | Free limit | Estimated daily usage | Notes |
|----------|-----------|----------------------|-------|
| Firestore reads | 50 000/day | ~8 640 | 1 read/10s per 12 zones |
| Firestore writes | 20 000/day | ~5 040 | Batched: 1 batch/30s × 12 zones |
| Cloud Run requests | 2 000 000/mo | ~43 200/event | 0.5 req/s × 86 400s |
| FCM messages | Unlimited | ~50 000 | 1 per attendee per alert |
| Pub/Sub | 10 GB/mo free | ~500 MB | 1 msg/s × ~150 bytes compressed |

Batch writes from the `BatchWriter` class coalesce updates so the 20 k/day write limit is never reached under normal load.

---

## Live services

| Service | URL |
|---------|-----|
| Staff Dashboard (Crowgy) | https://staff-dashboard-bdctnhxs3a-uc.a.run.app |
| Crowd Density | https://crowd-density-bdctnhxs3a-uc.a.run.app |
| Queue Management | https://queue-management-bdctnhxs3a-uc.a.run.app |
| Analytics | https://analytics-bdctnhxs3a-uc.a.run.app |
| Notifications | https://notifications-bdctnhxs3a-uc.a.run.app |

---

## License

MIT
