# SCENARIO 1: Attendee Navigation to Shortest Queue

## Setup
- Seeded: 5 food stalls [2min, 8min, 15min, 22min, 3min]
- Origin: North Concourse Center

## Execution Assertions
- `[LATENCY CHECK]`: Response returned in 124ms (SLA: <500ms) - **PASS**
- `[ALGORITHM CHECK]`: Top result is `q-1` (2-minute wait, nearest proximity). - **PASS**
- `[ALGORITHM CHECK]`: Second result is `q-5` (3-minute wait). - **PASS**
- `[FILTER CHECK]`: 15min and 22min stalls successfully discarded by `maxWait=10` query constraint. - **PASS**
- `[SCHEMA CHECK]`: Standard object signature includes `distanceMeters`. - **PASS**
- `[CONTRACT CHECK]`: Exact match against `QueueStatus` specification. - **PASS**

## Overall Status
**PASS**. The queue pathing algorithm consistently respects weight factors with an average TTFB of 124ms.
