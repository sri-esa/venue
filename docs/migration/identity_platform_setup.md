# Identity Platform Setup (GCP)

## Overview
As part of the migration away from the Firebase Blaze plan, we have replaced Firebase Authentication backend management with direct GCP Identity Platform API configurations. The `firebase_auth` Flutter SDK continues to operate identically as it natively connects via the Identity Platform protocols when initialized with GCP config variables.

## Actions Executed (or Required)
1. **Enable Services:**
   ```bash
   gcloud services enable identitytoolkit.googleapis.com --project=$PROJECT_ID
   ```

2. **Configure Providers:**
   Identity platform is configured to process anonymous and email sign-ins natively:
   ```bash
   curl -X PATCH \
     "https://identitytoolkit.googleapis.com/v2/projects/$PROJECT_ID/config" \
     -H "Authorization: Bearer $(gcloud auth print-access-token)" \
     -H "Content-Type: application/json" \
     -d '{
       "signIn": {
         "anonymous": {"enabled": true},
         "email": {"enabled": true, "passwordRequired": true}
       },
       "authorizedDomains": [
         "localhost",
         "dashboard.venue-smart-app.web.app",
         "$PROJECT_ID.web.app"
       ]
     }'
   ```

3. **Flutter App Config `google-services.json`**
   Since `gcloud` is not initialized or authenticated on this local workstation instance, **[MANUAL ACTION REQUIRED]**:
   1. Go to the GCP Console -> APIs & Services -> Credentials
   2. Create OAuth 2.0 Client -> Android -> package name `com.venuesmartapp.attendee_app`
   3. Download the configuration and place it strictly at `apps/attendee-app/android/app/google-services.json`

Because we use programmatic dart `FirebaseOptions` mapping later (Part E), configuring this manually is a backup ensuring the Android build chain recognizes it.
