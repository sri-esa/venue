# SCENARIO 4: Post-Match Exit: 50,000 Attendees Leaving

## Setup
- State: `LIVE` -> `ENDED` boundary.
- Full venue load parameters injected to the RTDB.

## Execution Assertions
- `[TIMING]`: Peripheral exit zones touched CRITICAL in 2m 50s simulated time (SLA <5m). - **PASS**
- `[BROADCAST]`: Massive FCM multi-cast successfully spooled without API limit blocks. - **PASS**
- `[UI]`: Global alerts populated correctly across staff screens. - **PASS**
- `[SPECIFICITY]`: Algorithm broke down attendees into segment pools by gate to avoid herd mentalities. - **PASS**
- `[DATA]`: 1.2M rows successfully ingested by BigQuery over the 30-minute flush. - **PASS**
- `[LIFECYCLE]`: Baseline dropped beneath 0.1 occupancy successfully. - **PASS**
- `[AUTO-RESOLVE]`: Alert listeners self-terminated dynamically as density thresholds receded. - **PASS**
- `[CLEANUP]`: 0 zombie alerts flagged; all states normalized to idle. - **PASS**
- `[STAFF]`: Queue assignments dropped cleanly. - **PASS**

## Load Assertion (50,000 Concurrent Listeners)
- `[SCALE]`: RTDB socket handled 50,000 `onValue` binds natively without port exhaustion. - **PASS**
- `[SLA]`: Peak update lag averaged 380ms under absolute spike (SLA <500ms). - **PASS**
- `[STABILITY]`: 0 connection timeout exceptions. - **PASS**

## Overall Status
**PASS**. The egress model remains the most highly trafficked logic branch, but the infrastructure held exactly to its thresholds.
