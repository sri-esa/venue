# SCENARIO 3: Gemini Assistant Live Context Query

## Setup
- State: Simulated HALF_TIME load with skewed densities.
- Origin point context: Section 12, Seat Row G

## Execution Assertions
**Query 1: "Where can I grab food without missing the next 10 minutes?"**
- `[LIVE DATA CHECK]`: Mentions Merchandise Zone (3min queue). - **PASS**
- `[AVOIDANCE CHECK]`: Did not hallucinate Food Court A or B (blocked out due to CRITICAL load). - **PASS**
- `[ACTION CHECK]`: Incorporated local walking metrics dynamically. - **PASS**
- `[FORMAT CHECK]`: Output strictly limited to <3 sentences via system prompt constraints. - **PASS**
- `[LATENCY CHECK]`: E2E payload roundtrip resolved in 2210ms (SLA: <5s). - **PASS**

**Query 2: "Is there anywhere to get a drink that's not too crowded?"**
- `[ROUTING CHECK]`: Safe vector routing generated avoiding specific polygons. - **PASS**
- `[AVOIDANCE CHECK]`: North Concourse (HIGH) excluded entirely from generated path. - **PASS**

**Query 3: "How do I get back to my seat from the south concourse?"**
- `[CONTEXT CHECK]`: Vertex injected prompt accurately localized user to Section 12 context natively. - **PASS**
- `[SPECIFICITY CHECK]`: Used precise "Gate 4 stairwell" routing rather than generic waypoints. - **PASS**

## Overall Status
**PASS**. Integration with the Vertex AI LLMs maintains hard system bounds and refuses to drop below latency requirements. **External dependency on `api.ai.google.dev` remained stable.**
