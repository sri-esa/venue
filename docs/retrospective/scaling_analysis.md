# Early Auto-Scaling Analysis

**Observation:**
Services scaled up prematurely during Phase 2. While the simulator predicted scale-up triggers at T+45 (half-time), production logs recorded scaling initiated earlier.

**Timeline Extracted from `scaling_timeline.json`:**
- **Predicted Scale:** T+45 minutes (Half-time rush)
- **Actual Scale:** T+31 minutes
- **Initial Service:** `crowd-density-service`

**Root Cause:**
- Actual attendance curves were much steeper than simulated; at T-30, 61% had arrived, compared to the simulation expectation. 
- AR Navigation usage was radically higher than projected (64% vs 40%). Continuous AR telemetry mapping sent significantly larger payload bursts to the backend to calculate spatial overlays.
- Cloud Run detected rapid CPU utilization bumps triggered by high-frequency spatial payload aggregation, forcing scaling earlier to meet latency SLAs, which successfully maintained performance but violated scaling predictions.

**Recommendation:**
Update auto-scaling predictive thresholds in capacity models. Recalibrate simulator data to use a 64% AR model instead of 40%, and map the arrival curve to real-world steepness.
