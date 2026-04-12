# Phase 2: Technology Stack Selection Analysis

## PART A — COMPONENT-BY-COMPONENT EVALUATION

| Component | Recommended Tool | Why This Tool | Alternative | Trade-off |
|-----------|-----------------|---------------|-------------|-----------|
| **1. Indoor AR Navigation** | **Google ARCore + Geospatial API / Maps Indoor API** | Fulfills Req #5 (Bi-directional AR routing). Leverages existing Google Maps indoor data for precise localization. | Custom OpenCV + Apple ARKit | ARKit only supports iOS; ARCore provides wider ecosystem reach. Building custom CV maps takes months. |
| **2. Real-Time Crowd Tracking** | **Google Maps Indoor + Wi-Fi RTT Location APIs** | Fulfills Req #1. Uses attendee devices acting as beacons to track density without massive additional hardware. | Wi-Fi Access Point Polling (Cisco DNA) | Cisco requires expensive on-prem networking integration; Google APIs use existing mobile chips. |
| **3. Queue Line Prediction** | **Vertex AI (Custom ML Models) + Cloud Run** | Fulfills Req #6. Translates POS velocity and IoT count into wait times (+/- 2 mins) reliably. | Manual Rule-Based Engine | Manual engines fail to account for dynamic variables (e.g., sudden POS crash) which ML can ingest natively. |
| **4. Attendee AI Assistant** | **Gemini 3 Pro via Vertex AI [BETA]** | Fulfills Req #7 (Dynamic UX routing). Multi-modal capabilities allow attendees to upload a photo to ask "is this the beer line?". | Google Dialogflow CX | Dialogflow is rigid and intent-matching based; Gemini handles nuanced, context-heavy queries better. |
| **5. Staff Coordination & Alerts** | **Firebase Cloud Messaging (FCM) + Firestore** | Fulfills Req #4 (<2s latency dashboard). Subscribes staff devices directly to relevant incident documents in Firestore. | WebSockets + Custom Node.js | Harder to scale connection pools for mobile push mechanics, drains client battery faster. |
| **6. IoT Ingestion Pipeline** | **Google Cloud Pub/Sub + Cloud Run** | Fulfills Req #1. Handles high-throughput sensor telemetry. *(Note: Cloud IoT Core is deprecated, modern GCP stack relies on Pub/Sub)*. | AWS IoT Core | Splitting the stack across cloud providers introduces unnecessary egress costs, complexity, and latency. |
| **7. Backend APIs** | **Google Cloud Run** | Matches venue traffic profiles (massive spikes pre-game / halftime, zero traffic midway). Serverless scales to 0. | Google Kubernetes Engine (GKE) | GKE requires cluster maintenance and devops overhead; Cloud Run is faster for dev cycles. |
| **8. Database (Live/Historical)** | **Firestore (Live) + BigQuery (Historical)** | Firestore meets 2s latency constraint (Req #4). BigQuery satisfies analytics/replay requirement (Req #9). | CockroachDB / PostgreSQL | Self-hosted or traditional RDBMS adds high maintenance and connection pool SPOF risks during sudden stadium surges. |
| **9. Push Notifications** | **Firebase Cloud Messaging (FCM)** | Best-in-class for cross-platform (iOS/Android) mobile alert delivery to clear lanes (Req #5/Stakeholder Conflict). | Twilio / SendGrid | FCM is native for mobile apps; Twilio is better suited for SMS rather than rich in-app overlays. |
| **10. Analytics & Reporting** | **Looker Studio on top of BigQuery** | Satisfies Req #9 (Post-event playback). Easy dashboard creation without custom frontend code. | Custom React + D3.js Dashboards | High engineering effort to build custom data visualization from scratch. |

---

## PART B — SYSTEM ARCHITECTURE DIAGRAM (TEXT FORMAT)

```text
[STADIUM WI-FI / BLE SENSORS]
      ↓  (JSON | <50ms | 1Hz per sensor)
[CLOUD PUB/SUB]
      ↓  (Events | <100ms | Real-time Stream)
[CLOUD RUN] (Data Normalization & Density Aggregation)
      ↓  (State Updates | <50ms | Event-driven)
[FIRESTORE] (Real-time state & Geo-queries)
      ↓  (State Sync | <500ms | Delta stream)
[ATTENDEE MOBILE APP & STAFF COMMAND DASHBOARD]

Additional Sub-Flows:

[TICKETING / POS APIs] → (Webhook | <1s | Per-transaction) → [CLOUD RUN] → (Stats) → [BIGQUERY & FIRESTORE]
[ATTENDEE APP (Query)] → (HTTPS/REST | <200ms | On-demand) → [VERTEX AI / GEMINI 3 PRO] → (Reasoned Route) → [ATTENDEE APP]
[ATTENDEE APP (Camera)] → (Edge Compute | <10ms | Continuous) → [ARCORE ON-DEVICE]
[ARCORE] ↔ (Spatial Anchors | <500ms | Intermittent) → [GOOGLE MAPS GEOSPATIAL API]
[CLOUD RUN] → (Insert Stream | Batch 1m) → [BIGQUERY] (Historical Log & Playback)
```

---

## PART C — LATENCY & SCALABILITY REQUIREMENTS MAPPING

| Component | Max Latency | Peak Concurrent Load | Scaling Strategy | SPOF Risk |
|-----------|-------------|----------------------|------------------|-----------|
| **1. Indoor AR Navigation** | < 100ms | 25,000 | **Edge Caching:** Pre-load venue 3D maps to app. Compute heavily on-device. | **NO:** Fails gracefully to 2D Maps. |
| **2. Crowd Density Tracking** | < 2 sec | 50,000 devices/sensors | **Horizontal:** Auto-scaling Cloud Run workers processing Pub/Sub topics. | **NO:** If some sensors fail, ML interpolates density. |
| **3. Queue Predict ML** | < 5 sec | 10,000 active queues | **Vertical/Horizontal:** Vertex AI endpoint autoscale. | **YES:** Mitigation: Cache last known wait times. |
| **4. AI Assistant (Gemini)** | < 1.5 sec | 15,000 queries/min | **API Quota Management:** Request quota bump prior to event. Semantic caching. | **YES:** Mitigation: Fallback to static rule-based FAQ. |
| **5. Staff Dashboard** | < 2 sec | 1,500 staff | **Firestore Listeners:** Native connection pooling. | **NO:** Multi-region Firestore replica. |
| **6. IoT Ingestion (Pub/Sub)** | < 100ms | 100,000 msgs/sec | **Managed Service:** Auto-scales infinitely by design. | **NO:** Inherent redundancy. |
| **7. Backend API (Cloud Run)** | < 200ms | 30,000 requests/sec | **Horizontal:** Max-instances configuration. | **NO:** Multi-zone deployment. |
| **8. Real-time DB (Firestore)**| < 500ms | 50,000 active read syncs | **Managed Service:** Regional data sharding. | **NO:** Global edge replication. |
| **9. Push Notifications** | < 3 sec | 50,000 batch send | **FCM Queueing:** Native Google scale. | **YES:** Mitigation: SMS fallback for critical staff alerts. |

---

## PART D — TECHNOLOGY RISK ANALYSIS

### 1. ARCore Accuracy Degradation in Dense Crowds
*   **Risk:** ARCore relies on visual features. Dense crowds block walls/floors, disrupting spatial anchor recognition.
*   **Likelihood:** High (at halftimes/post-event egress).
*   **Impact:** Medium (wayfinding becomes erratic).
*   **Mitigation:** Blend AR visual mapping with Wi-Fi RTT/Bluetooth BLE trilateration.
*   **Fallback:** App seamlessly downgrades to a dynamic 2D "blue dot" indoor map (Google Maps format) to prevent disorientation.

### 2. Firebase Connection Storms under Load
*   **Risk:** When 50,000 attendees exit the subway simultaneously and open the app, it creates a massive "thundering herd" connection spike, triggering rate limits on the Firestore handshake.
*   **Likelihood:** Medium.
*   **Impact:** High (system appears offline/frozen).
*   **Mitigation:** Implement exponential backoff in the client app. Bundle queries instead of opening thousands of individual document listeners per device.
*   **Fallback:** Client UI defaults to local cached data (resolves Unmet Need C), showing historical averages until live sync succeeds.

### 3. Gemini API Rate Limits During Peak Query Spikes
*   **Risk:** 30,000 fans simultaneously querying the AI assistant ("Where is the bathroom?") triggers Vertex AI quota limits.
*   **Likelihood:** High.
*   **Impact:** Medium (assistant times out).
*   **Mitigation:** [ASSUMPTION: We have reserved high-throughput quota with GCP]. Implement semantic caching (via Redis or Memorystore) to instantly return cached responses for common user intents without invoking the LLM.
*   **Fallback:** Route to a static directory/menu flow if the AI endpoint returns 429 Too Many Requests.

### 4. IoT Sensor Dropout / Network Saturation
*   **Risk:** Wi-Fi spectrum congestion knocks operational IoT queue sensors offline.
*   **Likelihood:** Medium.
*   **Impact:** High (Queue lengths become "Unknown").
*   **Mitigation:** Use a segregated frequency block (e.g., CBRS or Private 5G) for operational sensors, distinct from public Wi-Fi.
*   **Fallback:** Sensors must cache data locally (Req 10) and transmit in batches once reconnected. ML models interpolate missing gaps using transaction POS data.

### 5. Stadium Wi-Fi Saturation
*   **Risk:** Public Wi-Fi crashes, severing backend connections for attendees.
*   **Likelihood:** High (common in legacy venues).
*   **Impact:** Critical.
*   **Mitigation:** Compress payloads using Protobufs instead of raw JSON. Edge-cache 90% of the UI shell and static 3D maps pre-event.
*   **Fallback:** App goes into "Offline Survival Mode," allowing Bluetooth mesh networking for localized emergency push notifications from staff.

---

## PART E — BUILD vs. BUY vs. INTEGRATE DECISION TABLE

| Component | Decision | Justification | Estimated Dev Effort (days) |
|-----------|----------|---------------|----------------------|
| **Core App Frame & UI** | **BUILD** | Venue workflows are deeply tailored to the stadium brand/geometry. | 35 days |
| **AR Navigation Engine** | **INTEGRATE** | Building computer vision from scratch is impossible in standard timelines. Integrate Google ARCore + Maps. | 20 days |
| **Real-time DB / Live Data**| **INTEGRATE** | Firestore natively handles websockets, state syncing, and offline persistence. | 10 days |
| **AI Assistant** | **INTEGRATE** | Gemini 3 Pro APIs provide immediate industry-leading reasoning without training internal LLMs. | 15 days |
| **Queue Estimation Engine** | **BUILD** | Requires custom mathematical models taking in ticket counts, POS velocity, and local sensor data. | 25 days |
| **Ticketing / POS Systems**| **BUY/INTEGRATE**| Must integrate existing 3rd party providers (e.g., Ticketmaster) to ensure financial compliance and reliability. | 15 days |

---

## PART F — TECHNOLOGY STACK DOCUMENT

#### FRONTEND
*   **Attendee Mobile App:** Flutter (for high-performance iOS/Android parity) + Google ARCore (via `arcore_flutter_plugin`) + Gemini SDK.
*   **Staff Dashboard:** React.js / Next.js (SPA) + Firebase Client SDK (Real-time syncing).

#### BACKEND
*   **API Layer:** Google Cloud Run (Serverless Docker Containers via Node.js/TypeScript). High scalability for stateless API routes.
*   **Real-Time Engine:** Firebase Firestore (automatic socket management and live data syncing).
*   **AI/ML Layer:** Vertex AI (Gemini 3 Pro) [BETA features may apply] + BigQuery ML (for queue time predictive analytics).
*   **Data Pipeline:** Google Cloud Pub/Sub → Cloud Run Workers (Data normalization).

#### DATABASE
*   **Operational (Live):** Firebase Firestore. *Justification:* Natively supports <2s latency requirements (Req 4), offline caching out-of-the-box, and handles massive concurrent read shards.
*   **Analytical (Historical):** Google BigQuery. *Justification:* Best-in-class data warehouse for post-event playback (Req 9), bottleneck analysis, and ML model training on petabytes of log data.

#### INFRASTRUCTURE
*   **Cloud Provider:** Google Cloud Platform (GCP).
*   **Compute:** Cloud Run (serverless apps) + Cloud Functions (lightweight webhook handlers).
*   **Networking:** Cloud CDN (for static assets/maps edge caching). [ASSUMPTION: Stadium establishes a dedicated Private 5G or CBRS network for IoT/Staff apart from public Wi-Fi].
*   **Monitoring:** Google Cloud Observability (formerly Stackdriver) + Sentry (Exception tracking for mobile apps).

#### INTEGRATIONS
*   **Ticketing Systems (e.g., Ticketmaster):** Webhook / REST APIs for real-time ingress validation and turnstile drop-counts.
*   **Concession Point-of-Sale (e.g., Square/Micros):** REST APIs for transaction velocity to feed queue estimation models.
*   **Stadium Wi-Fi / Location Services (e.g., Cisco DNA Spaces):** REST stream to grab macro crowd heatmaps via Wi-Fi triangulation if standalone hardware sensors fail.
