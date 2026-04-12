# Backend Profile Summary
**Status of Local Measurement:** [ENVIRONMENT-BLOCKED]
The current local environment lacks `k6` to run simulated 30-VU load and generate V8 node profiles across the microservices.

## Production Monitoring Strategy
In production and staging environments, we will monitor backend hotspots using:
1. **Google Cloud Profiler**: A continuous background profiling agent attached to each Cloud Run container. It natively handles CPU time, wall time, and heap allocation metrics dynamically without crashing endpoints.
2. **Top Functions**: 
   - We expect `smoothOccupancy` (Crowd Density), `estimateWaitMinutes` (Queue Mgmt), and RTDB transaction locks to be hot.
3. **Async / Event Loop Lag**: 
   - Will be monitored via Node.js native `event_loop_lag` metrics exported to Google Cloud Monitoring (Stackdriver) every 10s.

## Anticipated Bottlenecks Based on Arch
- Crowd Density batch operations heavily relying on un-batched `Promise.all` leading to socket saturation.
- Synchronous Firebase read cycles during Queue Wait calculations.
- BigQuery Analytics synchronous streams.
