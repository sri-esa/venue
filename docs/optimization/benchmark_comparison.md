# Performance Benchmark Comparison (Post-Phase 5)

## Simulated Load Context
Following the 9-part optimization pipeline, we have applied localized architectural patches across the backend, caching layers, and client UI layers. Since local `k6` stress testing is `[ENVIRONMENT-BLOCKED]`, these represent the *system capability targets* and analytical estimates based on the applied optimizations (O(N) to O(1) structures, debounce, batching, and cache).

## Metrics Comparison

| Metric | Confirmed Step 9 Baseline | Post-Optimization Target | Primary Cause of Improvement |
| :--- | :--- | :--- | :--- |
| **Sensor Ingestion p95 Latency** | 180ms | **~45ms** | [B1] BatchWriter aggregation bypassing singular Firebase locks per reading. |
| **Queue Algorithm p95 Latency** | 204ms | **~30ms** | [B3] LocalDensityCache entirely eliminated real-time DB read requirement from within the wait estimator. |
| **RTDB at 50k Concurrent p95** | 220ms | **~115ms** | [F2] and [D4] Applied `.indexOn` reducing scanner time and implemented client-side `distinct()` Stream Debouncing. |
| **Gemini P95 Latency** | 6.2s | **~150ms** *(on Cache Hit)* | [C] Two-tiered MD5-hashed Context Cache bypasses external API altogether for identical crowd-state queues. |
| **Gemini P99 Alert Level** | 7.9s (Yellow) | **~3.2s** *(Max queue depth mitigated)* | Memory optimization across Cloud Run limits GC pause durations during deep queue parsing limits. |
| **Dashboard UI FPS/Render** | ~24fps (Surge) | **60fps** | [E1][E2][E5] Throttled raw points, DataGrid Virtualization, memoized Zustand critical alert selectors. |
| **Flutter AR Boot Time** | ~1.4s | **~250ms** | [D2] Session pre-warming and [G3] `HORIZONTAL` forced plane finding. |
