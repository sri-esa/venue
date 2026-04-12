# Gemini Response Caching Required

## Validation Context
During Step 10 API Integration testing, the explicit contract test targeting Gemini load response times (`tests/integration/gemini/gemini.integration.test.ts`) **FAILED**. 

## Failure Assertion
- **Test Condition**: Generate 10 sequential duplicate prompts resolving `What is the current wait time at Food Court A?`.
- **Expected Assertion**: `Response Time < 1s (Hot Cache)` for sequence 2-10.
- **Actual Measurement**: Every response tripped internal vertex inferences processing asynchronously, pulling `> 2.1s` consistently.

## Impact Analysis
While the actual p50 performance stays solid around ~1.9s under steady load, a massive burst exceeding 500 VUs parallel querying will trigger native Google API throttling and completely break our 8s SLA boundary. Since real venue loads typically generate thousands of parallel inquiries (e.g. "Where are the bathrooms?") exactly during breaks in play, we cannot route every text string to the LLM directly without checking the cache.

## Resolution Requirement
**PHASE 5 OPTIMIZATION BLOCKER:** Before live deployment, we must implement a standard Redis or Memcached middleware caching layer tracking the explicit `venueId`, `locationNode`, and `prompt` hashes with a 30s TTL expiry. All identical queries within the 30s epoch must return the cached vector response instead of hitting Vertex APIs.
