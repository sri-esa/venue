# Smart Venue Management System

Real-time crowd intelligence, queue monitoring, and venue operations tooling for large-capacity sports events.

## Overview

This repository contains a monorepo for a smart sports venue platform spanning:

- attendee experiences
- staff operations dashboards
- Cloud Run backend services
- IoT simulation tools
- infrastructure and deployment assets
- shared contracts, docs, and validation suites

The current staff-facing web app is branded as **Crowgy**, a dark operations dashboard for live stadium monitoring.

## Main Applications

### `apps/attendee-app`

Flutter mobile app for attendee-facing experiences, including navigation and venue assistance.

### `apps/staff-dashboard`

Crowgy, the React-based staff dashboard for:

- real-time crowd density monitoring
- queue tracking
- active alert management
- heat map inspection
- venue analytics

Stack:

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- Recharts
- Firebase Firestore listeners

## Backend Services

The `services/` directory contains Cloud Run services supporting:

- crowd density processing
- queue management
- notifications
- analytics
- event configuration
- staff alert workflows

## Repository Structure

```text
crowd-management/
├── apps/
│   ├── attendee-app/
│   └── staff-dashboard/
├── credentials/
├── docs/
├── infrastructure/
├── iot/
├── packages/
├── scripts/
├── services/
├── shared/
└── tests/
```

For the current detailed frontend layout, see:

- [docs/phase2_folder_structure.md](docs/phase2_folder_structure.md)

## Local Development

### Staff Dashboard

```bash
cd apps/staff-dashboard
npm install
npm run dev
```

Additional validation:

```bash
npm run typecheck
npm run build
```

### Attendee App

```bash
cd apps/attendee-app
flutter pub get
flutter run
```

## Deployment

The Crowgy frontend includes deployment assets for Cloud Run:

- `apps/staff-dashboard/Dockerfile`
- `apps/staff-dashboard/nginx.conf`
- `apps/staff-dashboard/cloudbuild.yaml`
- `apps/staff-dashboard/deploy.ps1`

Typical frontend deploy flow:

```bash
cd apps/staff-dashboard
gcloud builds submit --config cloudbuild.yaml
```

Backend services have their own deployment paths under `services/` and supporting scripts under `scripts/`.

## Live Services

| Service | URL |
|---------|-----|
| Staff Dashboard (Crowgy) | https://staff-dashboard-265873384374.us-central1.run.app |
| Crowd Density | https://crowd-density-265873384374.us-central1.run.app |
| Queue Management | https://queue-management-265873384374.us-central1.run.app |
| Analytics | https://analytics-265873384374.us-central1.run.app |
| Notifications | https://notifications-265873384374.us-central1.run.app |

All listed Cloud Run services are deployed in project `crowd-management-system-492802` in region `us-central1`.

## Configuration and Secrets

Secrets, API keys, tokens, and environment-specific configuration must not be committed to GitHub.

Use your deployment environment, local shell environment, or a managed secret solution for sensitive values. Keep all private configuration out of tracked markdown, source files, and commit history.

## Documentation

Key docs:

- [docs/phase2_system_architecture.md](docs/phase2_system_architecture.md)
- [docs/phase2_folder_structure.md](docs/phase2_folder_structure.md)
- [docs/system_complete.md](docs/system_complete.md)

## Status

| Component | Status |
|-----------|--------|
| Crowd Density Service | Deployed |
| Queue Management Service | Deployed |
| Analytics Service | Deployed |
| Notifications Service | Deployed |
| Attendee App (Flutter) | In development |
| Staff Dashboard (Crowgy) | Active frontend development with deploy pipeline in place |

## License

MIT
