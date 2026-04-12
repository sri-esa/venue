# Next Event Preparation Checklist
**Run this 1 week before every event**

## SECTION 1: DATA PREPARATION [3-5 days before]
- [ ] Update venue configuration in Firestore if changed:
  - New stalls added (e.g., NW concession nodes from event_001)
  - Zone boundaries changed (new construction)
  - Staff roster updated
  - Ticket tier configuration updated
  - Seat metadata for new seating sections
- [ ] Update event configuration:
  ```bash
  POST $ANALYTICS_SERVICE_URL/events/create
  {eventId, venueId, name, startTime, endTime, expectedAttendance}
  ```
- [ ] Seed IoT device registry with any new sensors:
  [MANUAL ACTION REQUIRED] — venue IT team

## SECTION 2: SYSTEM VERIFICATION [2-3 days before]
- [ ] Run recalibrated simulation (FULL_DAY at 10x speed):
  ```bash
  python iot/simulator/sensor_sim.py --config iot/simulator/sim_config_calibrated.json --phase FULL_DAY --speed 10x --chaos --seed {new_seed}
  ```
- [ ] Run full regression suite:
  ```bash
  scripts/run_regression.sh
  ```
  Expected: 7/7 PASSED
- [ ] Verify all service health in production:
  Expected: all "ok"
- [ ] Verify Firebase indexes: all READY (not BUILDING)
- [ ] Verify BigQuery tables exist and have correct schemas
- [ ] Verify Secret Manager: all secrets have current values
- [ ] Check Google Cloud status: no ongoing incidents (status.cloud.google.com)

## SECTION 3: DEPLOYMENT [1 day before]
- [ ] If any code changes since last event:
  - Run full test suite (all services + apps)
  - Blue-green deploy per service (Part C of Step 13)
  - Smoke test all GREEN revisions before traffic switch
  - Run regression suite post-deploy
- [ ] If no code changes:
  - Verify existing services still healthy
  - No deployment needed (immutable revisions)
- [ ] Deploy any venue configuration updates to Firestore
- [ ] Scale services up from min-instances=0:
  ```bash
  gcloud run services update crowd-density-service --min-instances=2 --region=asia-south1
  ```
- [ ] Notify staff team: system ready for event

## SECTION 4: EVENT DAY [morning of event]
- [ ] Execute Phase 0 (staff-only test) — abbreviated version:
  Duration: 30 minutes (not 24 hours for repeat events)
  Scope: verify dashboard loads, alerts fire, FCM works
- [ ] Confirm IoT sensors online (all 12 zones reporting)
- [ ] Confirm staff devices registered for FCM
- [ ] Brief staff on any new features since last event
- [ ] Confirm incident response contacts are current
- [ ] Start monitoring dashboard before gates open

## SECTION 5: POST-EVENT [within 24 hours]
- [ ] Run post-event pipeline:
  ```bash
  scripts/post_event_pipeline.sh {eventId} {venueId}
  ```
- [ ] Review auto-generated report
- [ ] File improvement tickets based on Gemini recommendations
- [ ] Scale services down to min-instances=0:
  [BILLING] services hibernate until next event
- [ ] Update `docs/retrospective/latest_metrics.json`
- [ ] Share report with venue operations team
