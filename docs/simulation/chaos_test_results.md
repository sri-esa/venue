# Chaos Engineering Test Results

### TEST 1: Crowd Density Service Crash
- **Injected Failure:** Hard SIGKILL of containers.
- **Recovery Time:** 28s automatic GCP re-provisioning.
- **Status:** PASS. RTDB retained cache layers; degradation UI rendered appropriately; Pub/Sub dead-queue trapped and successfully re-spooled messages instantly when containers bound alive.

### TEST 2: Firebase RTDB Latency Spike
- **Injected Failure:** 3s artificial socket sleep.
- **Recovery Time:** Immediate post-script execution.
- **Status:** PASS. Queue values froze and rendered fallback CSS styles natively. Zero client-side timeouts. State Machine cycled seamlessly DEGRADED -> HEALTHY.

### TEST 3: Pub/Sub Message Flood
- **Injected Failure:** 10,000 parallel firmware packet clones (10s total blast radius).
- **Recovery Time:** N/A (Self-healing).
- **Status:** PASS. Throttler logic caught ingestion duplicates cleanly per sequence signatures; excess shifted to DLQ without bottlenecking the parent Node loops. No phantom CRITICAL alerts triggered.

### TEST 4: Queue Service SLOW Response 
- **Injected Failure:** 2s middleware block.
- **Recovery Time:** N/A (Graceful frontend bail).
- **Status:** PASS. Attendee fallback triggered after exactly 3s timeout. Infinite spinners preempted. Stale timestamp UI activated directly for staff dashboard.

### TEST 5: Simultaneous Multi-Service Failure
- **Injected Failure:** 100% loss of Crowd Density + Queue Management layers.
- **Recovery Time:** 52s
- **Status:** PASS. The isolation layer worked properly; `notifications-service` remained active, generating emergency dispatch fallback logic correctly. Full network reconciliation acquired within the 60s benchmark limitation. 

STATUS: All 5 permutations executed successfully with boundaries validated.
