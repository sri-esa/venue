# Phase 2: Project Folder Structure

## Overview
This document captures the current monorepo structure for the Smart Sports Venue Management System, with special attention to the actively maintained `apps/staff-dashboard` frontend now branded as `Crowgy`.

## Source Directory Tree

```text
/
├── apps/
│   ├── attendee-app/                     # Flutter + Riverpod mobile attendee app
│   │   ├── android/
│   │   ├── ios/
│   │   ├── lib/
│   │   │   ├── features/
│   │   │   ├── models/
│   │   │   ├── providers/
│   │   │   ├── router/
│   │   │   └── services/
│   │   └── test/
│   └── staff-dashboard/                 # Crowgy React operations dashboard
│       ├── public/
│       │   ├── favicon.svg
│       │   ├── firebase-messaging-sw.js
│       │   └── icons.svg
│       ├── src/
│       │   ├── assets/
│       │   ├── components/
│       │   │   ├── charts/              # Reserved for future chart abstractions
│       │   │   ├── common/              # DensityBadge, LiveIndicator, MetricCard, WaitTimeBadge
│       │   │   └── layout/              # AppShell, Sidebar
│       │   ├── config/                  # Firebase config and Firestore/mock fallback data
│       │   ├── hooks/                   # Health and Firestore-related hooks
│       │   ├── pages/
│       │   │   ├── Alerts/
│       │   │   ├── Analytics/
│       │   │   ├── Dashboard/
│       │   │   ├── HeatMap/
│       │   │   ├── Queues/
│       │   │   ├── Settings/
│       │   │   └── StaffMap/
│       │   ├── services/
│       │   │   ├── api/                 # Reserved for future HTTP clients
│       │   │   ├── firebase/            # Firestore subscriptions and listeners
│       │   │   └── notifications/       # Browser FCM bindings
│       │   ├── store/                   # Zustand slices
│       │   ├── types/                   # Venue, crowd, queue, alert, and staff types
│       │   ├── App.tsx
│       │   ├── main.tsx
│       │   ├── style.css
│       │   └── vite-env.d.ts
│       ├── cloudbuild.yaml              # Cloud Build + Cloud Run deploy flow
│       ├── deploy.ps1                   # Local PowerShell deploy helper
│       ├── Dockerfile                   # Multi-stage Vite build + nginx runtime image
│       ├── nginx.conf                   # SPA routing + static asset caching
│       ├── tailwind.config.js
│       ├── tsconfig.json
│       └── vite.config.ts
├── credentials/                         # Service account key placeholders
├── docs/                                # Architecture, setup, and delivery documentation
├── infrastructure/                      # Terraform, Firebase, monitoring, BigQuery config
├── iot/
│   └── simulator/                       # Sensor and queue simulation utilities
├── packages/
│   └── shared-types/
├── scripts/                             # Deployment and post-event automation
├── services/                            # Cloud Run backend services
├── shared/                              # Cross-service contracts and shared types
└── tests/                               # Global automated validation suites
```

## Staff Dashboard Notes

The current `apps/staff-dashboard` implementation is the authoritative frontend for operations staff. It uses:

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Zustand
- Recharts
- Firebase Firestore listeners
- Cloud Run deployment via `Dockerfile`, `cloudbuild.yaml`, and `deploy.ps1`

## Deployment Files

The frontend deploy path currently relies on:

- `Dockerfile`: builds the Vite app and serves it with nginx on port `8080`
- `cloudbuild.yaml`: Cloud Build pipeline for image build, push, and Cloud Run deploy
- `deploy.ps1`: local wrapper that maps `GCP_API_KEY` and `FCM_VAPID_KEY` into the Vite-prefixed build args
