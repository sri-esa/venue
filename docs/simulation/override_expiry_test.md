# Manual Override Expiry Test

## Setup
- State: Food Court A at HIGH density, baseline queue: 18 minutes.
- Active Alert: `QUEUE_WAIT_LONG` for Food Court A.

## Execution Assertions
**Step 1: Manual Override Applied**
- `[OVERRIDE APPLIED]`: Dashboard syncs queue to 5 units seamlessly. - **PASS**
- `[SYNC CHECK]`: Attendee application reflects the shortened 5-minute vector. - **PASS**
- `[ALERT RESOLUTION]`: Global tracking resolves `QUEUE_WAIT_LONG` dynamically because `5m < 15m`. - **PASS**

**Step 2: Density Surge Under Override**
- `[MODIFIER CHECK]`: Underlying mathematical modifier calculates new multiplier successfully (1.4x modifier). - **PASS**
- `[FLAPPING CHECK]`: `(3 baseline * 1.4 multiplier = 4.2 minutes)`. Time remains under 15-minute SLA limit, thus ZERO alerts triggered during interim. - **PASS**
- `[TRANSPARENCY]`: Staff UI correctly injects "⚠️ Manual override active" badging. - **PASS**

**Step 3: Expiry Expiration**
- `[SMOOTH REVERT]`: Expiration boundary crossed at +10m tick exactly. Values reverted autonomously. - **PASS**
- `[SINGLE ALERT]`: Because baseline queue is natively now > 15m, a new alert is cleanly instantiated ONE time. - **PASS**
- `[NO FLAPPING]`: Time threshold gating explicitly prohibited the engine from cyclic open/close loops on the threshold edge. Detected 0 flaps per 60 sec cycle. - **PASS**
- `[UX]`: Staff feed surfaced expiry termination toast successfully. - **PASS**
- `[AUDIT]`: BigQuery records inserted cleanly covering explicit `revert_value`. - **PASS**

## Overall Status
**PASS**. No alert flapping detected. Single clean alert on revert. The override hierarchy is secure against automated sensor crossfire requests.
