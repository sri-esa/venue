# Phase 2: System Architecture – Smart Venue Management System

## PART A — HIGH-LEVEL ARCHITECTURE OVERVIEW

### LAYER 1 — PERCEPTION LAYER
- **System Components:** IoT turnstile beam sensors, Bluetooth BLE beacons, Point-of-Sale (POS) terminals, Ticketing scanners, Wi-Fi access points.
- **Captured Data:**
  - Turnstile/BLE: Raw drop-counts and zone occupancy (1Hz frequency, JSON format).
  - POS: Transaction timestamp and stall ID (On-event frequency, REST webhook).
  - Wi-Fi/Cameras: MAC-anonymized probe requests and bounding box counts for macro density (5Hz, MQTT).
- **Transmission:** Raw data is pushed via HTTP (for webhooks) and MQTT over TLS (for IoT sensors) directly into Google Cloud Pub/Sub topics.
- **Latency Requirement:** < 100ms from sensor to cloud layer.
- **Failure Behavior:** Sensors cache locally up to 24 hours (Phase 1 Req 10) and transmit in batch when connection restores. [ASSUMPTION] IoT edge devices have a minimum of 512MB RAM for caching.

### LAYER 2 — INTELLIGENCE LAYER
- **System Components:** Google Cloud Run (microservices), Vertex AI (Gemini 3 Pro + ML Models), Cloud Dataflow.
- **Gemini Reasoning:** Triggered *on-demand* by user natural language queries. The service analyzes live queue data from RTDB and maps the user's current node to generate personalized responses. [BETA-RISK]
- **ML Triggers:** The strict Queue Estimation model evaluates on a streaming window (every 30s), aggregating POS velocity and IoT traffic count to mathematically adjust projected wait times.
- **Business Logic:** Routing algorithms run inside stateless Cloud Run services. Example: If `density > capacity_threshold`, the service mutates RTDB state, triggering an alert cascade to the staff dashboard.
- **Latency Requirement:** < 500ms for data normalization; < 2.5s for complex Vertex AI inferences.
- **Failure Behavior:** If ML orchestration endpoints fail, the system degrades to a static heuristic algorithm (e.g., historical averages for the given event minute).

### LAYER 3 — DATA LAYER
- **Operational (Live Snapshot):** Firebase Realtime Database (RTDB) handles live density integers, staff geographical locations, and live wait times. Extremely fast socket sync, ephemeral data.
- **Structured (State):** Firestore handles static configurations [VENUE-SPECIFIC] like geometric concourse maps, attendee profiles, and event timeline states.
- **Analytical (Historical Log):** BigQuery ingests all data pipelines for post-match analysis (Req 9).
- **Retention Policies:** RTDB TTL is exactly 12 hours. Firestore user data is deleted upon explicit user request (GDPR). BigQuery logs are retained for 5 years.
- **Privacy:** Strict aggregation (no individual tracking) occurs at the edge before hitting RTDB. PII resides exclusively in Firestore behind rigid security rules.

### LAYER 4 — EXPERIENCE LAYER
- **Components:** Attendee Mobile App (Flutter), Staff Command Dashboard (React), Public Digital Signage (Android TV boxes).
- **Consumption:** The Attendee Flutter app connects to RTDB via WebSocket for sub-second, continuous wait-time updates. The Dashboard consumes Firestore snapshots for dynamic supervisor alerts.
- **Latency Requirement:** UI updates < 200ms after data layer mutation occurs.
- **Failure Behavior:** Offline-first caching mode blocks live network features, limiting the user to pre-loaded static 2D vector maps.

---

## PART B — MICROSERVICES ARCHITECTURE

All services run as serverless, independent containers on **Google Cloud Run**.

| Service Name | Responsibility | API Endpoints | Consumes From | Publishes To | Scaling Trigger | SLA |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1. CROWD DENSITY Svc** | Ingests Wi-Fi/IoT streams, aggregates occupancy per [VENUE-SPECIFIC] zone. | `POST /ingest/wifi`<br>`POST /ingest/cctv` | Pub/Sub `density-stream` | RTDB `/zones`, BigQuery | CPU > 60% | <200ms |
| **2. QUEUE MGMT Svc** | Calculates wait times using POS webhooks + IoT density data. | `POST /webhooks/pos`<br>`GET /queues/{id}` | Pub/Sub `pos-events` | RTDB `/queues`, BigQuery | HTTP Req Rate | <500ms |
| **3. AR NAVIGATION Svc** | Translates 2D node graphs into 3D spatial anchor routes for client app. | `GET /routes/{start}/{end}`<br>`GET /anchors` | Firestore `/venue_map` | Flutter Client | HTTP Req Rate | <100ms |
| **4. GEMINI ASSISTANT** | Resolves NLP user queries into structured routing operations. [BETA-RISK] | `POST /chat/query` | Flutter Client, RTDB | Flutter Client | Queue Depth | <1.5s |
| **5. STAFF ALERT Svc** | Applies incident escalation logic. Routes critical spikes to dashboards. | `POST /alerts/trigger`<br>`PATCH /alerts/{id}` | CROWD DENSITY Svc | RTDB `/alerts`, FCM | QPS | <500ms |
| **6. EVENT CONFIG Svc** | Manages gate start/stop times and venue layout morphing. | `PUT /events/{id}/state` | React Dashboard | Firestore `/events` | Manual | <500ms |
| **7. NOTIFICATION Svc** | Triggers FCM push payloads for targeted crowd routing/clearance. | `POST /notify/zone`<br>`POST /notify/user` | STAFF ALERT Svc | Firebase FCM API | Pub/Sub Topic | <2s |
| **8. ANALYTICS PIPELINE** | Batches RTDB/Firestore state changes sequentially into BigQuery. | *(Internal PB/Sub)* | RTDB, Firestore CDC | BigQuery `raw_logs` | Message Count | <5min |

---

## PART C — DATA FLOW DIAGRAMS

### SCENARIO 1: AR Navigation to Open Food Stall (Shortest Queue)
1. **[App] -> [Queue Mgmt]:** Attendee taps "Food". App calls `GET /queues/shortest` via HTTPS. (<100ms)
2. **[Queue Mgmt] -> [RTDB]:** Service queries RTDB for live wait velocities. Determines "Food Center B" has shortest queue. (<50ms)
3. **[App] -> [AR Nav]:** App invokes AR Nav service to plot path to "Food Center B".
4. **[AR Nav] -> [App]:** Returns spatial path JSON to the Flutter App. (<100ms)
5. **[App] -> [Google Geospatial API]:** App aligns camera feed with Google global & local anchors. (<500ms)
6. **[Render Step]:** AR blue guiding line is superimposed on screen. Total E2E Latency: < 1 second.

### SCENARIO 2: Dangerous Density Spike at Gate 7 (IoT Alert)
1. **[IoT Sensor]:** Edge camera tracks 500 people in a 100-capacity zone. Publishes MQTT packet. (T+0s).
2. **[Crowd Density Svc]:** Ingests packet via PubSub, mathematically calculates a 500% anomaly. Updates RTDB `/zones/gate_7`. (T+1s)
3. **[Staff Alert Svc]:** Listens to RTDB mutation. Automatically logs a "Level 1" incident in Firestore. (T+1.5s)
4. **[Staff Dashboard]:** React App consumes Firestore snapshot. Gate 7 flashes bright red on heatmap. (T+2s)
5. **[Escalation - T+60s]:** Supervisor fails to acknowledge the UI alert. Staff Alert Svc triggers Notification Service.
6. **[Notification Svc]:** Fires an overrides FCM push alert directly to all local security mobile devices. (T+62s).

### SCENARIO 3: Gemini NLP Query [BETA-RISK]
**Input:** "Where can I grab food without missing the next 10 minutes?"
1. **[App] -> [Gemini Assistant]:** Transmits text + user GPS coordinates + ticketed seat ID.
2. **[Gemini Assistant] -> [Vertex AI]:** Sends engineered prompt containing the payload + JSON serialization of active, open queues.
3. **[Vertex AI]:** Cross-references walking distance (via Maps integration) and real-time wait time.
4. **[Gemini Assistant] -> [App]:** Translates model output into structured payload: `targetNode: burger_c` + UI text `"Burger Stand C is a 2 min walk. No line."`
5. **[App]:** Unpacks targetNode and automatically invokes AR Render engine.

### SCENARIO 4: Post-Match Egress (50,000 exiting)
1. **[Event Config]:** Admin manually advances Event State to `EGRESS`.
2. **[Crowd Density]:** Shuts down predictive queuing to conserve compute; focuses purely on outward flow tracking.
3. **[AR Nav]:** Overrides all internal destination logic. Active navigation paths now point exclusively to structurally optimal [VENUE-SPECIFIC] exit gates to mitigate staircase bottlenecks.
4. **[Notification]:** API interfaces automatically broadcast real-time public transit delays/status to digital queue boards near exits.

### SCENARIO 5: Stadium Wi-Fi Failure (40% coverage lost)
*   **IoT Sensors:** Drop offline. *Graceful Degradation:* Edges caches payloads internally. Queue Estimation Svc utilizes historical predictive curves until sensors reconnect.
*   **Attendee App:** Client socket drops. *Graceful Degradation:* UI switches into static mode. Renders pre-downloaded 2D venue map SVG. Renders banner: *"Live wait times unavailable due to network."*
*   **AR Routing:** *Graceful Degradation:* Fails to load new cloud-based spatial anchors. Reverts to local device IMU step-tracking if the map was previously initialized.
*   **Emergency Coordination:** Staff devices fail over from FCM to dedicated SMS text payloads sent from a separate cellular network layer.

---

## PART D — DATABASE SCHEMA DESIGN

### Firebase Realtime Database (Live Transient State / ms latency required)
```json
// /venues/{venueId}/zones/{zoneId}/density
{ 
  "count": 214, 
  "capacity": 300, 
  "status": "nominal", 
  "updatedAt": 1712499999 
} // TTL: 12h via Cloud Function cron

// /venues/{venueId}/queues/{queueId}
{ 
  "estimatedWaitSeconds": 420, 
  "isOpen": true, 
  "velocity": 1.2, 
  "updatedAt": 1712499999 
} // TTL: 12h

// /staff/{staffId}/location
{ 
  "lat": 34.123, 
  "lng": -118.456, 
  "updatedAt": 1712499999 
} // TTL: 24h
```

### Firestore (Structured Document State)
*   **`attendees` Collection:**
    *   *Schema:* `{ uid, name, preferences: { ada_routing: bool }, ticket_id }`
    *   *Indexes:* `ticket_id` (Ascending).
    *   *Security:* Read/Write strictly limited via `request.auth.uid == resource.id`.
*   **`events` Collection:**
    *   *Schema:* `{ event_id, state: "INGRESS|ACTIVE|EGRESS", scheduled_start, actual_start }`
    *   *Security:* Read global, Write Admin-only.
*   **`venue_map` Collection:** [VENUE-SPECIFIC]
    *   *Schema:* `{ node_id, coordinates: [lat, lng], floor: 1, type: "concession|restroom|gate", edges: [neighbor_ids] }`
    *   *Security:* Read global, Write Admin-only.
*   **`staff_profiles` Collection:**
    *   *Schema:* `{ uid, role: "GUARD|EMT|MANAGER", assignedZone: "gate_1", active: true }`
    *   *Security:* Read Authenticated, Write Admin-only.

### BigQuery (Analytical Data Warehouse)
*   **`crowd_density_log` Table:**
    *   *Schema:* `timestamp (TIMESTAMP), zone_id (STRING), attendee_count (INT), event_id (STRING)`
    *   *Partitioning:* Heavily partitioned by `DATE(timestamp)`.
    *   *Retention:* 5 years.
    *   *Enables:* Bottleneck playback simulation and predictive ML model re-training.
*   **`alert_incidents` Table:**
    *   *Schema:* `alert_id (STRING), type (STRING), escalation_level (INT), resolved_time_sec (INT64), event_id (STRING)`
    *   *Retention:* 10 years (Liability compliance).
    *   *Enables:* SLA compliance tracking (e.g., verifying if EMTs resolve incidents < 3 mins).

---

## PART E — SECURITY & PRIVACY ARCHITECTURE

### 1. Authentication & Authorization
*   **Attendees:** Firebase Authentication. Public routing works anonymously. Personalized routing requires Google Sign-In or linking a ticket barcode.
*   **Staff:** Google Workspace SSO integration enforcing strict IAM role-mapping for Dashboard access.
*   **Services:** Google Cloud IAM leveraging least-privilege Principle Service Accounts (e.g., `density-processor@prod-xyz.iam.gserviceaccount.com`).
*   **API Gateway:** Google Cloud API Gateway handles OAuth token validation and strict rate-limiting.

### 2. Data Privacy (GDPR/DPDP Compliance)
*   **Aggregation Rule:** Edge IoT nodes compute density. They transmit pure integers (`count: 42`). No video or PII is ever transmitted from perception to the intelligence layer here.
*   **Data Deletion:** Attendees deleting their account via the Flutter app triggers a secure Cloud Function that irrevocably purges their Firestore PII.

### 3. Network Security
*   All webhook endpoints mandated to run on HTTPS (TLS 1.3). Real-time DB listeners use encrypted WSS.
*   **Cloud Armor:** Positioned immediately in front of Cloud Run to automatically scrub DDoS influx attacks attempting to crash the queue predictor.
*   **IoT Authentication:** Edge devices use strict mTLS with X.509 certificates to authenticate MQTT PubSub packets.

### 4. Threat Model & Mitigation
1. **IoT Spoofing Injection:** An attacker physically accesses Wi-Fi and sends false density packets. *Mitigation:* The Pub/Sub endpoint enforces X.509 cert validation per device.
2. **DDoS on Gemini API:** An attacker scripts thousands of NLP requests. *Mitigation:* Cloud Armor rate bounds + CAPTCHA required for anonymous accounts hitting $>10$ queries/min.
3. **Pivoting via Stolen Staff Tablet:** An unguarded tablet accesses the dashboard. *Mitigation:* 4-hour hard session token timeouts, geo-fenced dashboard access.
4. **Data Exfiltration:** Insider threat dumps database. *Mitigation:* Apply GCP VPC Service Controls preventing bulk export outside predefined static IP barriers.

---

## PART F — INTEGRATION ARCHITECTURE

### 1. TICKETING SYSTEM (e.g., Ticketmaster)
*   **Method:** REST Webhook (POST inbound to Cloud Run).
*   **Contract Exchanged:** `{ "ticketId": "AB12", "gateId": "G6", "timestamp": "2026-04-07T..." }`
*   **Auth:** Shared HMAC SHA-256 signature in HTTP Header.
*   **Failure Config:** If partner webhook fails, the system bypasses ticket integration and relies purely on IoT turnstile line-break counters.

### 2. STADIUM WI-FI INFRASTRUCTURE (e.g., Cisco Solutions)
*   **Method:** Periodic MQTT probes to Cloud Pub/Sub.
*   **Contract Exchanged:** `{ "ap_id": "AP_51", "mac_hashes_qty": 114, "timestamp": 1234567890 }`
*   **Auth:** mTLS device certificates.
*   **Failure Config:** Real-time ML heatmap calculations proceed using only remaining stable spatial nodes.

### 3. CCTV / VIDEO ANALYTICS SYSTEM
*   **Method:** Edge ML pushes structured intelligence to REST API.
*   **Contract Exchanged:** `{ "camera_id": "C_12", "zone": "south_stairs", "occupancy": 84 }`
*   **Auth:** Embedded OAuth 2.0 Client Credentials JWT.
*   **Failure Config:** Visual validation stops; Operations relies on guard radios and Wi-Fi RTT.

### 4. F&B POS SYSTEMS (e.g., Square)
*   **Method:** Transaction webhook trigger (POST).
*   **Contract Exchanged:** `{ "pos_id": "S_4", "amount_usd": 15.00, "items": 2, "flushQueueSignal": true }`
*   **Auth:** Static API Key rotation.
*   **Failure Config:** Queue algorithm calculates wait times using the last known stable POS velocity until heartbeat resumes.

### 5. EMERGENCY SERVICES
*   **Method:** Dedicated secure API pushing outbound Webhooks to CAD dispatch systems.
*   **Contract Exchanged:** `{ "incidentId": "INC-01", "latLng": [34.1, -118.2], "severity": "CRITICAL" }`
*   **Auth:** OAuth 2.0 standard.
*   **Failure Config:** Fallback triggers a Twilio SMS function directly paging Command Center supervisors.

---

## PART G — ARCHITECTURE DECISION RECORD (ADR)

*   **ADR-001: ARCore + Google Maps Platform for Wayfinding**
    *   *STATUS:* Accepted
    *   *CONTEXT:* Need a robust indoor 3D mapping solution without building our own computer vision models.
    *   *DECISION:* Use Google's Geospatial API framework.
    *   *CONSEQUENCES:* Dramatically cuts Phase 3 engineering time. Requires alignment of internal venue maps with Google's public spatial topology structure.
*   **ADR-002: Cloud Pub/Sub Direct Ingestion**
    *   *STATUS:* Accepted
    *   *CONTEXT:* IoT Core deprecation in 2023 requires a new GCP-native ingestion strategy.
    *   *DECISION:* Edge devices will publish MQTT/REST directly to PubSub topics.
    *   *CONSEQUENCES:* Forces the infrastructure team to handle X.509 certificate provisioning manually at the edge.
*   **ADR-003: Cloud Run for Microservices**
    *   *STATUS:* Accepted
    *   *CONTEXT:* Predicting exact compute needed for a massive stadium surge is inefficient on bare metal or rigid Kubernetes pods.
    *   *DECISION:* Favor fully managed serverless containers.
    *   *CONSEQUENCES:* Simplifies DevOps drastically. Constrains background tasks to a strict 60-minute execution cap, ensuring we use Dataflow for long analytical batches.
*   **ADR-004: Dual-Database Strategy (RTDB + Firestore)**
    *   *STATUS:* Accepted
    *   *CONTEXT:* We need both sub-500ms variable latency (densities) and complex document relationships (users).
    *   *DECISION:* Split the data layer. Ephemeral states use RTDB; rigid configurations/user states use Firestore.
    *   *CONSEQUENCES:* Adds slight complexity when joining profile data with live location data, but avoids rate-limiting bottlenecks.
    *   *AMENDMENT (Phase 5)*: Direct RTDB streaming to 50,000+ localized concurrent sockets generates immense processing overhead. All new Firebase listeners MUST strictly adhere to `distinct()` debouncing and `Exponential Moving Average (EMA)` caching at the edge (no raw subscriptions) to prevent quota exhaustion.
*   **ADR-005: Use of Gemini 3 Pro for Passenger Routing [BETA-RISK]**
    *   *STATUS:* Accepted
    *   *CONTEXT:* Complex conditional attendee routing ("where is food that is fast but also near my seat") requires enormous hardcoded logic branching.
    *   *DECISION:* Delegate path finding reasoning natively to the LLM by framing system state in JSON context windows.
    *   *CONSEQUENCES:* Offers incredibly personalized service. Opens a hard risk vulnerability to Vertex AI quota limits during half-time.
*   **ADR-006: High-Edge Computation for Density**
    *   *STATUS:* Accepted
    *   *CONTEXT:* Transmitting live CCTV feeds from 2,000 cameras to the cloud will crash venue fiber arrays and violate privacy laws.
    *   *DECISION:* Edge processing only. Hardware emits integer totals (`5`).
    *   *CONSEQUENCES:* Solves data privacy entirely. Severely limits our post-event playback ability (we cannot physically look back at the video to verify the integer).
*   **ADR-007: Mandatory Offline App Survival Mode**
    *   *STATUS:* Accepted
    *   *CONTEXT:* Signal failure inside 50,000-person concrete bowls is common.
    *   *DECISION:* Bundle heavy 2D map SVGs statically into the Flutter installer size.
    *   *CONSEQUENCES:* Increases base application download size by ~20MB, protecting UX during Wi-Fi failure.
*   **ADR-008: External HMAC Integration Contracts**
    *   *STATUS:* Accepted
    *   *CONTEXT:* Open webhook endpoints invite replay attacks during ticketing integrations.
    *   *DECISION:* Enforce HMAC SHA-256 for all critical inbound traffic.
    *   *CONSEQUENCES:* Elevates security standards but increases friction for third-party vendors who must conform to cryptographic signing rather than simple API keys.
