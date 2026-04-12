# Using Google Antigravity for Continuous Improvement

## When to Use Antigravity Agents

### AFTER EVERY EVENT:
1. **Feed post-event report to Antigravity:**
   "Read docs/retrospective/event_{id}_auto_report.md. Based on the metrics and Gemini recommendations, identify the top 3 code changes that would most improve the next event. Generate implementation plans for each."

2. **Simulator recalibration:**
   "Read docs/retrospective/simulator_recalibration.md. Update iot/simulator/sensor_sim.py and queue_sim.py to match the calibrated parameters. Run the updated simulation and confirm metrics align with production."

3. **Threshold tuning:**
   "Review the alert thresholds in .env. Based on event_{id} data showing [specific observation], propose updated threshold values with justification. Show before/after simulation comparison."

### BETWEEN EVENTS (maintenance window):
4. **Dependency updates:**
   "Check all npm packages and Flutter dependencies for security updates. Update non-breaking versions. Run full test suite and regression suite. Report any breaking changes with migration paths."

5. **Performance regression checks:**
   "Run the full benchmark suite from tests/performance/post-optimization/. Compare against docs/optimization/benchmark_comparison.md. Flag any metric that has regressed > 10%."

6. **Code quality improvements:**
   "Run static analysis on all services and apps. Identify and fix: unused variables, missing error handling, TODO comments older than 30 days, functions exceeding 50 lines."

## Antigravity Agent Prompt Templates

**TEMPLATE 1: POST-EVENT IMPROVEMENT SPRINT**
```text
Context: Read all files in docs/retrospective/event_{id}/
         Read docs/phase2_system_architecture.md (ADRs)
         Read .env.example (configurable parameters)

Task: Based on event_{id} data, implement these improvements:
1. [Specific improvement from retrospective]
2. [Specific improvement from retrospective]
3. [Specific improvement from retrospective]

Constraints:
- Do not modify shared/types/ interfaces (locked)
- All changes must pass scripts/run_regression.sh
- All new [CONFIGURABLE-VIA-ENV] added to .env.example
- Output changes to: docs/iteration/event_{id}_improvements.md

Verify: Run regression suite after all changes. Report: PASS/FAIL.
```

**TEMPLATE 2: THRESHOLD TUNING SESSION**
```text
Context: Read docs/retrospective/event_{id}_metrics.json
         Read services/crowd-density/src/processor.ts (current threshold values)

Observation: [Specific metric observation, e.g.: "32 Level 1 alerts fired but 0 required staff action — threshold may be too sensitive"]

Task: 
1. Analyze whether current thresholds are correctly calibrated
2. Propose new threshold values with data justification
3. Update [CONFIGURABLE-VIA-ENV] in .env.example
4. Run simulation with new thresholds to verify improvement
5. Show: alerts fired before vs after threshold change

Output: docs/iteration/threshold_tuning_{id}.md
```

**TEMPLATE 3: FEATURE DEVELOPMENT SPRINT**
```text
Context: Read docs/requirements_coverage_final.md
         Read docs/retrospective/event_{id}_recommendations.json
         Read docs/phase2_system_architecture.md

Feature Request: [New feature from stakeholder feedback or Gemini recommendation]

Task:
1. Assess: does this feature require a new ADR?
2. Design: how does this feature integrate with existing architecture without breaking existing functionality?
3. Implement: build the feature with:
   - Unit tests (minimum 70% coverage)
   - Integration test for new service boundaries
   - Performance test (must not degrade existing baselines)
4. Document: update relevant phase docs
5. Verify: run full regression suite

Output: docs/iteration/feature_{name}_{date}.md
```

**TEMPLATE 4: INCIDENT ANALYSIS SPRINT**
*(For after any P0/P1 incident in production)*
```text
Context: Read docs/incidents/incident_{date}_{severity}.md
         Read docs/deployment/incident_response_playbook.md
         Read relevant service logs from docs/retrospective/

Task:
1. Root cause analysis: trace the incident from first signal to resolution using log evidence
2. Timeline reconstruction: exact sequence of events
3. Why didn't existing tests catch this?
4. What code change prevents recurrence?
5. What playbook update is needed?
6. Implement the prevention code change
7. Update incident_response_playbook.md with new runbook step
8. Add regression test that would have caught this issue

Output: docs/incidents/incident_{date}_remediation.md
```

## Iteration Cadence

**IMMEDIATELY AFTER EVENT (within 24 hours):**
- [ ] Post-event pipeline runs automatically
- [ ] Review auto-generated report
- [ ] File any bugs discovered during event as GitHub issues
- [ ] Run Template 1 if clear improvements identified

**WEEKLY (during active event season):**
- [ ] Dependency security scan
- [ ] Performance regression check
- [ ] Review any new GitHub issues

**PRE-EVENT (1 week before next event):**
- [ ] Run recalibrated simulation (full FULL_DAY phase)
- [ ] Review and apply threshold tuning
- [ ] Deploy any improvements from iteration sprints
- [ ] Run full regression suite
- [ ] Execute pre-deployment checklist (Part A of Step 13)

**QUARTERLY:**
- [ ] Architecture review: do any ADRs need updating?
- [ ] Cost optimization review: is spend still efficient?
- [ ] Technology refresh: any new Google/Firebase APIs to adopt?
- [ ] Personalization model review: are recommendations improving?
