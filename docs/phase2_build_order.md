# Phase 2: Build Order & Dependency Graph

## Overview
This document outlines the sequential build order for the Smart Sports Venue Management System based on the Technology Stack Analysis. It categorizes components into execution phases, highlighting dependencies, blockers, and parallelization opportunities to optimize engineering velocity.

---

## 1. Dependency Graph (Text-Based)

```text
[PHASE 1: Foundation]
Cloud Infrastructure Setup (GCP/Firebase) 
  ├──> Blocks: Phase 2, Phase 3
  └──> Parallel with: UI/UX Wireframing

[PHASE 2: Data & Ingestion Layer] (Requires: Phase 1)
Pub/Sub Topics & BigQuery Datasets ─> Blocks: Data Ingestion Pipeline
Firestore (Real-time DB) Setup ────> Blocks: Core Backend APIs, Staff Dashboard
  ├──> IoT/PubSub Cloud Run Workers (Requires: Pub/Sub)
       └──> Blocks: ML Queue Prediction Engine
  └──> POS & Ticketing Webhooks (Requires: BigQuery/Firestore)
       └──> Blocks: ML Queue Prediction Engine

[PHASE 3: Core Backend APIs & ML] (Requires: Phase 2)
Cloud Run API Layer (Requires: Firestore) ─> Blocks: Frontend Apps
Vertex AI Queue Prediction (Requires: POS Webhooks & IoT Ingestion)
  └──> Blocks: Wait Time UI in Mobile App

[PHASE 4: Frontend Framework Cores] (Requires: Phase 3 API Stubs)
Attendee Mobile App (Flutter Core) ─> Blocks: AR & AI Integrations
Staff Dashboard (React.js/Next.js) ─> Blocks: FCM Push Notifications

[PHASE 5: Advanced Features & Edge] (Requires: Phase 4)
Google ARCore Maps Integration (Requires: App Core)
Gemini 3 Pro Assistant (Requires: App Core, Cloud Run APIs)
Firebase Cloud Messaging Alerts (Requires: Staff Dashboard, App Core)
```

---

## 2. Build Execution Phases

### Phase 1: Foundation (Must Be Built First)
These components form the bedrock of the system. Everything else depends on them existing.
*   **Google Cloud Project & IAM Roles:** Establishing networking, service accounts, and billing policies.
*   **Firebase Project Initialization:** Linking GCP to Firebase to enable Firestore and FCM native mechanics.
*   **Data Schema Definition:** Defining the data models for Firestore (e.g., `queues`, `incidents`, `users`) and BigQuery schemas.
*   ***Unblocked by:*** Nothing. Start immediately.

### Phase 2: Data Persistence & Ingestion Pipeline
Once the foundation is laid, build the pipes that move data in real-time.
*   **IoT Pub/Sub Pipeline:** Set up the Pub/Sub topics and the Cloud Run workers that listen to sensor data and write to Firestore.
*   **3rd Party Webhooks:** Build the endpoints to ingest Ticketmaster drop-counts and POS vendor transaction data.
*   ***Blocked by:*** Phase 1 (GCP/Firebase setup).
*   ***Parallel Opportunities:*** The IoT pipeline can be built completely independently of the POS/Ticketing webhook ingestion. Data engineers can configure BigQuery while backend engineers build the Cloud Run ingest workers.

### Phase 3: Core Backend APIs & Machine Learning 
Transforming raw ingested data into actionable insights for the front end.
*   **Cloud Run API Layer:** The RESTful endpoints the mobile app and dashboard will call for state that isn't handled by live Firestore socket listeners.
*   **Queue Length Estimation Engine (Vertex AI):** Training and deploying ML models that use Phase 2 data to predict wait times.
*   ***Blocked by:*** Phase 2. The ML model *strictly* requires historical and streaming data flows (IoT + POS) to be completed before it can generate meaningful predictions.
*   ***Parallel Opportunities:*** Cloud Run API business logic generation can run concurrently with the ML model training.

### Phase 4: Frontend Application Cores
Building the user-facing application shells and real-time listeners.
*   **Staff Dashboard (React.js):** Hooking up Firestore live listeners to display real-time crowd heatmaps and escalating incident lanes.
*   **Attendee Mobile App (Flutter):** Setting up user authentication, UI routing, and live concession wait-time UI logic.
*   ***Blocked by:*** Phase 3. However, frontend teams can begin simultaneously with Phase 2 *if* the backend team establishes mocked API contracts (Swagger/OpenAPI) and mock Firestore JSON dumps immediately.
*   ***Parallel Opportunities:*** The mobile app and the staff dashboard share no direct frontend code and can be built by two separate teams simultaneously.

### Phase 5: Edge Integrations & Advanced AI (Final Polish)
These features sit on top of the working application shells.
*   **Google ARCore + Maps Indoor API:** Implementing the intensive 3D wayfinding camera layer.
*   **Gemini 3 Pro AI Assistant:** Integrating the NLP chatbot that dynamically queries the real-time API layer.
*   **FCM Push Notifications:** Wiring up the escalation alerts to staff and medical lane-clearing local pushes to attendees.
*   ***Blocked by:*** Phase 4. The AR layer cannot physically exist without the Flutter app shell camera viewport. Gemini cannot accurately route attendees unless the Queue Estimation Engine (Phase 3) is functioning and accurate.

---

## 3. Summary of Bottlenecks and Dev Velocity

1. **The Primary Strict Blocker:** The IoT Ingestion Pipeline & POS Webhooks (Phase 2). Because the ML predictive engine, the AI Assistant routing, and the AR wayfinding all rely on having accurate underlying stadium state, this data ingestion pipeline must be completed and validated first. 
2. **The Longest Dev Cycle:** The ARCore integration (est. 20 days) and Frontend App Frame (est. 35 days) carry the highest raw dev estimates from the earlier tech stack analysis. Because they are in Phase 5 and 4 respectively, **API stubs must be created on Day 2** so mobile engineers are not waiting for weeks on data engineers to finish Phase 2 and 3.
