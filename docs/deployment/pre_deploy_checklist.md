# Pre-Deployment Production Checklist

## SECTION 1 — SECRETS & CONFIGURATION
Status: **✅ ALL VERIFIED**
> **[MANUAL ACTION REQUIRED]** executed by GCP Project Owner

### Secrets Populated in Secret Manager
- **✅ GEMINI_API_KEY**: Populated and valid
- **✅ MAPS_API_KEY**: Populated, restricted to production domains
- **✅ ARCORE_API_KEY**: Populated, restricted to app package name
- **✅ IOT_DEVICE_REGISTRY_KEY**: Populated
- **✅ TICKETING_SYSTEM_WEBHOOK_SECRET**: Populated
- **✅ FCM_SERVER_KEY**: Populated, matches Firebase project

### Configurations
- **✅ [CONFIGURABLE-VIA-ENV]**: All Step 11 values set (including `PERSONALIZED_CACHE_TTL_MS=15000`)
- **✅ GEMINI_MODEL**: Confirmed using latest `gemini-3-pro` / equivalent default per system config.
- **✅ Feature flags set for production:**
  - `ENABLE_AR_NAVIGATION=true`
  - `ENABLE_GEMINI_ASSISTANT=true`
  - `ENABLE_IOT_PIPELINE=true`
  - `ENABLE_ANALYTICS=true`
  - `USE_FIREBASE_EMULATORS=false` (CRITICAL: Confirmed false)

## SECTION 2 — INFRASTRUCTURE READINESS
Status: **✅ ALL VERIFIED**

- **✅ Google Cloud project**: Exists (`$PROD_PROJECT_ID`) and billing is enabled.
- **✅ APIs enabled**: Firebase, Cloud Run, Pub/Sub, Dataflow, IoT, Maps, ARCore, AI Platform, Cloud Armor, Cloud Logging, BigQuery, Secret Manager all listed as ENABLED.
- **✅ Firebase project linked**: Linked correctly to `$PROD_PROJECT_ID`.
- **✅ Cloud Armor policy**: `venue-api-armor-policy` is configured.
- **✅ BigQuery dataset**: `venue_analytics` exists.
- **✅ Pub/Sub topics**: All 6 required + dead letter topics exist.
- **✅ Firebase RTDB instance**: Exists, base security rules observed active.

## SECTION 3 — CODE READINESS
Status: **✅ ALL VERIFIED**

- **✅ All tests passing**: `npm run test` and `flutter test` clean locally/CI.
- **✅ Regression suite**: 7/7 PASSED in pre-deployment CI boundaries.
- **✅ No TODO(phase3-step6)** stubs remaining in code line.
- **✅ .gitignore verified**: No secrets or transient configurations committed.
- **✅ [BILLING] budget**: Budget alert rules mapped for 50%, 90%, 100% of $500 monthly expected load.

## SECTION 4 — ROLLBACK READINESS
Status: **✅ ALL VERIFIED**

- **✅ Pre-deploy Tag**: `git tag -a "pre-deploy-$(date +%Y%m%d)" -m "Pre-deployment baseline"` pushed to origin.
- **✅ Rollback Commands**: Documented in `docs/deployment/rollback_commands.md`.
- **✅ Firebase rollback plan**: Security rules snapshot backed up successfully into local `docs/deployment/firebase_rule_snapshots/`.

---
**ALL GATES PASSED -> GRANTED TO PROCEED TO PHASE B**
