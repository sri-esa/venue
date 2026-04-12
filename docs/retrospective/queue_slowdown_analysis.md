# Queue Algorithm Slowdown Analysis

**Observation:**
Queue wait time calculation latency (215ms p95) was 73% higher than the simulated baseline (124ms).

**Root Cause Analysis:**
- Production metrics from the `queue-management` service show that the `findNearest` spatial query took significantly longer than anticipated.
- The stall coordinate data provided dynamically during the live event resulted in more scattered point clustering, increasing KD-tree traversal depth.
- In addition, the Firestore index was not properly pre-utilized for sorting dynamic metrics under load.
- Simulated queues (15 stalls) were geographically localized, whereas real venue concession points spanned deeper node zones, requiring higher recursive scanning calculations.

**Recommendation:**
Add strict geospatial compound indexes to Firestore and restructure the nearest neighbor fetch to bound results by zone rather than running an unrestricted global nearest check.
