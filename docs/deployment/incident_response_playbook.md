# Venue Smart System — Incident Response Playbook

## Severity Definitions
| Severity | Definition | Response Time | Example |
|----------|------------|---------------|---------|
| P0 | System down, attendees impacted | < 5 minutes | All services down |
| P1 | Feature degraded, partial impact | < 15 minutes | FCM not delivering |
| P2 | Minor issue, workaround exists | < 1 hour | Single zone stale |
| P3 | Cosmetic/logging issue | Next business day | Chart not rendering |

## Runbook: CROWD DENSITY SERVICE DOWN
Symptoms: HeatMap shows no updates, system_health = CRITICAL
Steps:
1. Check Cloud Run service status:
   `gcloud run services describe crowd-density-service --region=asia-south1`
2. Check recent logs:
   `gcloud logs read "resource.type=cloud_run_revision AND resource.labels.service_name=crowd-density-service" --limit=50 --format=json`
3. If OOM: increase memory and redeploy.
4. If crash loop: roll back to previous revision using the explicit Rollback Commands documentation.
5. If Pub/Sub connection lost: restart service (forces instance restart).
Timeline: Detect in <30s, fix in <5min

## Runbook: FCM NOTIFICATIONS NOT DELIVERING
Symptoms: Attendees not receiving alerts, FCM delivery rate drops
Steps:
1. Check notifications-service health.
2. Check FCM quota in Firebase Console.
3. Verify FCM server key valid natively inside Secret Manager.
4. Check Pub/Sub: are messages reaching `notifications` topic?
5. If Google-side issue: check `status.firebase.google.com`
   *[EXTERNAL-DEPENDENCY]*: may require waiting for Google fix.
6. Fallback: post manual announcements relying strictly on Physical PA system fallback.
Timeline: Detect in <2min, diagnose in <10min

## Runbook: FIREBASE RTDB LATENCY SPIKE
Symptoms: App updates slow, RTDB p95 > 500ms
Steps:
1. Check connection count (approaching 50,000 maximum socket payload limit?).
2. Audit code configurations asserting `distinct()` debouncing isn't suppressed natively.
3. Check Cloud Monitoring: is it localized Firebase or generalized?
4. If connection count high: enable restrictive connection rate controls.
5. If Firebase-wide: check `status.firebase.google.com`.
Timeline: Detect in <3min, diagnose in <10min

## Runbook: GEMINI API RATE LIMITED
Symptoms: Assistant shows native errors, Gemini bounding error rate > 5%
Steps:
1. Inspect Cache hit rate metrics — if low, cache hashes may have forcibly invalidated.
2. Verify `GEMINI_API_KEY` status is valid in Secret Manager.
3. Observe Vertex AI quota inside GCP bounds.
4. If natively rate-limited: request quota buffer increase natively (requires 24-48 hours lead time).
5. Interim: double cache TTL mapping. Update: `PERSONALIZED_CACHE_TTL_MS=60000` (1 min).
6. If quota exhausted violently: immediately disable Gemini feature bounds. (App downgrades to base AR/static configurations).
Timeline: Detect in <2min, manual overrides in <5min.

## Runbook: MULTI-SERVICE FAILURE (P0)
Symptoms: Multiple services dropping simultaneously natively
Steps:
1. Audit isolated Cloud Run containers manually noting cascading timeouts.
2. Is `asia-south1` down? (Audit `status.cloud.google.com`).
3. If complete region bound failed: Execute P0 Failover sequence.
   **[MANUAL ACTION REQUIRED]** (No automated failover exists natively). Manually redeploy entire Terraform bound mapping strictly to `asia-south2` (Delhi). Required GCP infrastructure Lead authentication.
4. Issue external ops dispatch triggering all physical failover boundaries.
Timeline: Detect in <1min, manual region shift mapped ~15min.

## Communication Templates

**P0 Incident — Staff Notification:**
"SYSTEM ALERT: Venue Smart System is experiencing technical difficulties. Please use standard manual coordination procedures. Operations team is actively resolving the issue. ETA: {X} minutes."

**P0 Incident — Attendee App Message:**
"We're experiencing temporary technical difficulties. Our team is working to restore full service. The internal venue map is securely available offline in the meantime."

## Post-Incident Requirements
After every P0/P1 incident:
- Write incident report within bounds of 24 hours.
- Document locally routing into `docs/incidents/incident_{date}_{severity}.md`.
- Detail natively timeline, root bounds, prevention methods.
- Brief resolution at structural sprint review bounding sessions.
