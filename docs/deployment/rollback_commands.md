# Production Rollback Commands

If a P0/P1 incident requires an immediate hard rollback of active production services to the last fully-stable pre-deployment footprint, execute the exact commands below. No human evaluation is required to run a trigger given explicit SLAs.

## Crowd Density Service Rollback
```bash
gcloud run services update-traffic crowd-density-service \
  --to-revisions=crowd-density-service-v-baseline-100 \
  --region=asia-south1
```

## Queue Management Service Rollback
```bash
gcloud run services update-traffic queue-management-service \
  --to-revisions=queue-management-service-v-baseline-100 \
  --region=asia-south1
```

## Notifications Service Rollback
```bash
gcloud run services update-traffic notifications-service \
  --to-revisions=notifications-service-v-baseline-100 \
  --region=asia-south1
```

## Analytics Service Rollback
```bash
gcloud run services update-traffic analytics-service \
  --to-revisions=analytics-service-v-baseline-100 \
  --region=asia-south1
```

## Firebase Rules Rollback
Locate the previously backed up rule definitions inside `docs/deployment/firebase_rule_snapshots/`.
```bash
# Push the baseline firestore rules
firebase deploy --only firestore:rules --project=$PROD_PROJECT_ID

# Push the baseline RTDB rules
firebase deploy --only database --project=$PROD_PROJECT_ID
```

## Attendee App Feature Flag Override
If an unrecoverable crash loop exists in the latest published Attendee App (iOS/Android), disable API boundaries centrally:
1. Access Firebase Remote Config from the Firebase Console.
2. Toggle `CLIENT_FORCE_DOWNGRADE_ALERT=true` (Shows maintenance banner mapped to offline static maps mode).
3. Publish configuration live.
