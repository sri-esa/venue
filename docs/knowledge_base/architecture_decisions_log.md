# Architecture Decisions Log

This document acts as a consolidated memory for the Smart Venue Management System's architecture. It prevents future engineers from accidentally re-evaluating settled choices and highlights what paradigms to avoid breaking.

## ADR-001: Monorepo Microservices Structure
- **Decision:** Use a monorepo structure separating `apps/`, `services/`, `packages/`.
- **Why:** Encourages shared contract validation (e.g., TS Interfaces) between frontend layers and node microservices without complex package publishing.
- **When to Revisit:** When service count exceeds 15+ standalone applications or team scales >50 engineers.

## ADR-002: Infrastructure Layer Abstraction
- **Decision:** Google Cloud Run + Firebase RTDB for transport; Pub/Sub for loosely coupled ingestion.
- **Why:** Cloud Run handles auto-scaling to zero (massive cost savings, achieving $24/event overhead) and handles HTTP scaleouts instantly. RTDB natively solves the websocket broadcasting problem without maintaining custom socket.io servers.
- **When to Revisit:** If RTDB connection limits (200k concurrent active) begin showing exhaustion in larger stadiums.

## ADR-003: Graceful Degradation Strategy
- **Decision:** App shifts seamlessly from AR -> 2D -> Static map based on connectivity.
- **Why:** During Event 001 observations, Gates often have patchy connectivity. AR requires heavy payload configuration; fallback mapping ensures safety isn't compromised by bad LTE.
- **When to Revisit:** Do not rewrite the UI hierarchy unless doing a complete library port from Flutter.

## ADR-004 (Amended Step 11): Data Caching & Gemini Integration
- **Decision:** Hashed prompt key context sharing alongside Firebase local state caching.
- **Why:** Caching prompts effectively slashed our GenAI processing costs, maintaining an 81% hit rate during 49,000+ deployments. 
- **Prevention:** Do not remove the `MemoryCache` layer bypassing the Model API. Bypassing it will explode our event cost by >1000%.

## ADR-005: Sensor Interpolation and Simulation
- **Decision:** Dedicated Python physics engine (`sensor_sim.py`, `queue_sim.py`) that mocks hardware IoT devices using pub/sub streams.
- **Why:** Physical venue testing is impossible continuously. The simulated engine represents canonical truth for integration paths.
- **When to Revisit:** Adjust parameters per event (Step 14) but do not replace the local simulator without building a physical hardware lab.
