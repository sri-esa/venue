# Northwest Stall Simulation Results

**Simulation Config:** Half-Time Surge (`--phase HALF_TIME`)
**Updated File:** `sim_config_v2.json` / `queue_sim.py` (added NW stalls)
**Scenario Tested:** Half-time surge behaviors routing load towards the newly configured Concourse stalls in `zone-05`.

## Results
- **Wait Times (Food Court A & B):** 
  - *Before:* ~25 minutes peak
  - *After:* ~15 minutes peak
- **Load Balancing:** Demand successfully distributed across 2 additional food options and 1 additional beverage option natively using the nearest-neighbor algorithm.
- **Alert Frequency:** North Concourse `CRITICAL` queue density alerts dropped heavily, reducing staff dispatch needs to the physical bottleneck.

**Conclusion:** The solution successfully fulfills the algorithmic constraints required to safely handle a repeat crowd surge of similar magnitude.
