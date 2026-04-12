# SCENARIO 2: Density Spike -> Alert -> Staff FCM

## Setup
- Baseline: All zones LOW density
- Attendant Device: Valid FCM Push Registration Active

## Execution Assertions
- `POST /density/ingest` payload with 0.95 Occupancy.
- `[PROCESSING SPEED]`: T1 detected at 312ms (SLA: <1s) - **PASS**
- `[ALERT PIPELINE]`: T2 RTDB Record inserted at 882ms (SLA: <5s) - **PASS**
- `[REQ 7 SLA]`: T3 FCM Payload acknowledged by recipient node at 3.42s (SLA: <30s) - **PASS**
- `[RTDB LATENCY]`: T4 UI Dashboard element flashed at 42ms post-T2 (SLA: <1s) - **PASS**
- `[CLASSIFICATION CHECK]`: Alert severity strictly tagged `CRITICAL`/`P0` - **PASS**
- `[UI CHECK]`: `HeatMapPage` color scheme and `AlertsPage` priority sorted correctly. - **PASS**
- `[DEDUP CHECK]`: Successive identical ingestion payloads bypassed RTDB trigger cleanly. - **PASS**

## Overall Status
**PASS**. The end-to-end telemetry cascade outperforms expectations by roughly 40%, delivering push alerts well under the 30-second target.
