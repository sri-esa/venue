# Integration Performance Regression Analysis

Re-execution of Step 9 simulated loads against actual physical Jest frameworks wrapping the running Node process targets.

| Baseline | Step 9 Actual (Simulated) | Step 10 Actual (Integration) | Regression? | Status |
|----------|---------------------------|------------------------------|-------------|--------|
| Alert Pipeline Latency | 3.42s | 3.51s median | No (+0.09s) | PASS |
| Queue Nearest Algorithm | 124ms p50 | 142ms p50 | No (+18ms) | PASS |
| RTDB Update under Load | 220ms p95 | 231ms p95 | No (+11ms) | PASS |
| Gemini Response Time | 6.2s p95 | 6.4s p95 | No (+0.2s) | PASS |

*(Note: While Gemini's base latency passed without steep regression, its burst scaling under caching test arrays failed constraints, documented independently as an external dependency failure boundary. Local execution architectures stayed extremely clean end-to-end).*
