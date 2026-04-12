# Cloud Pub/Sub Pipeline Setup

This document records the exact topics, subscriptions, and their purposes for the Crowd Intelligence Module.

## 1. Pub/Sub Topics
| Topic Name | Purpose | Producers |
|---|---|---|
| `crowd-density-raw` | High-frequency IoT edge density payloads | `sensor_sim.py`, Hardware |
| `crowd-density-processed` | Aggregated heatmaps per venue | `crowd-density-service` |
| `queue-events-raw` | POS receipts and wait-length increment triggers | `queue_sim.py`, POS Providers |
| `queue-events-processed` | Standardized estimated wait times | `queue-management-service` |
| `venue-alerts` | Critical alerts from real-time evaluation logic | `crowd-density-service`, `queue-management-service` |
| `fcm-notifications` | Ready-to-send targeted push notifications | `crowd-density-service`, `notifications-service` |

## 2. Pub/Sub Subscriptions
| Subscription Target | Type | From Topic |
|---|---|---|
| `crowd-density-service` | push | `crowd-density-raw` |
| `queue-management-service` | push | `queue-events-raw` |
| `staff-alerts-service` | push | `venue-alerts` |
| `notifications-service` | push | `venue-alerts` |
| `notifications-service` | push | `fcm-notifications` |

All topics include pull subscriptions (e.g., `crowd-density-raw-debug-pull`) for debugging and replay scenarios.

## 3. Dead Letter Topics
If endpoints continuously fail after 5 delivery attempts, payloads fall over to:
- `crowd-density-dead-letter`
- `queue-events-dead-letter`
- `alerts-dead-letter`

## 4. Local Emulator Setup
If testing locally without GCP keys, the Pub/Sub emulator will be mapped to `localhost:8085` as configured in `scripts/run-emulators.sh`.
