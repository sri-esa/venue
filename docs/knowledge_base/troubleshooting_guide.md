# Troubleshooting Guide

A quick-reference for the on-call engineer during extreme conditions.

## Issue 1: Premature Cloud Run Auto-Scaling Threshold Triggers
- **SYMPTOM:** Dashboard analytics shows service bounds scaling past 10+ instances unexpectedly at T-45 (Gates Open).
- **LIKELY CAUSE:** The auto-scaler CPU target is picking up early AR query bursts aggressively.
- **DIAGNOSTIC:** `gcloud run services describe crowd-density-service`
- **FIX:** Generally, let it run. It's intended behavior handling bursts. If hitting max limits prematurely: 
  `gcloud run services update crowd-density-service --max-instances=20`
- **PREVENTION:** CI pipeline will recalibrate expected T-X attendance curves via `sim_config_calibrated.json` automatically between events.

## Issue 2: Phase 1 Rendering Timeouts (AR Loading Issue)
- **SYMPTOM:** Attendee App shows white screen or "Waiting for Map" spinner.
- **LIKELY CAUSE:** Weak network connectivity at venue entry bottlenecks preventing Firebase stream instantiation.
- **DIAGNOSTIC:** Search logs for `AR Renderer Error: connection and request timeout` under `resource.labels.location_zone`.
- **FIX:** Ask users to disable AR and fall back to 2D Maps (App usually prompts this after 10s of blocking).
- **PREVENTION:** Use local caching instantiation logic for base app bootstrap, preventing rendering from relying heavily on the initial socket handshake (Fixed in Step 14 CI planning).

## Issue 3: Alert Flapping on Dashboard
- **SYMPTOM:** Staff screen continuously flashes RED vs YELLOW for density alerts.
- **LIKELY CAUSE:** Threshold boundary is too sensitive, reacting to minor IoT noise.
- **DIAGNOSTIC:** Check `dashboard-frontend` network payload interval for zone-status updates.
- **FIX:** Increase the density calculation hysteresis loop.
- **PREVENTION:** Adjust `processor.ts` values in `services/crowd-density/src/processor.ts`.

## Issue 4: Endpoints Time Out After Node Code Update
- **SYMPTOM:** The regression test fails with `FetchError: network timeout`.
- **LIKELY CAUSE:** The `start_services.sh` background script failed to finish spinning up the Fastify worker instances, or TypeScript failed to compile.
- **DIAGNOSTIC:** `cat services/logs/crowd-density.log`
- **FIX:** Preemptively resolve `ts-node` package failures. Run `npm run build` individually.
- **PREVENTION:** The `scripts/run_regression.sh` ensures nothing goes to production without 7/7 PASSED tests.

## Issue 5: Gemini Quota Exhaustion
- **SYMPTOM:** Gemini Assistant replies "I am currently taking a break". API returns 429.
- **LIKELY CAUSE:** Model limits hit, usually meaning the caching layer in `services/analytics/` has broken.
- **DIAGNOSTIC:** Check `docs/retrospective/event_{id}_metrics.json` for low Cache Hit Rate.
- **FIX:** Restart analytics service. Adjust `MAX_MEMORY_ENTRIES=200` in `.env.example`
- **PREVENTION:** Ensure queries hit hashed cache index before querying Google's API model endpoints.
