# Requirement 7 Closure Document

**Original Requirement:**
The system SHALL push proactive/predictive ingress alerts. 

**Deficit Identified:**
FCM foreground/background orchestration missing within the Attendee App pipeline.

**Resolution:**
Requirement 7 is now [CLOSED].

**Implementation Path:**
1. **Intelligence Layer Evaluation (`services/crowd-density/src/processor.ts`)**
   The `CrowdDensityProcessor` triggers an alert if `occupancy >= 0.90` (`CRITICAL`), provided the zone type is not `SEATING`. It then constructs a JSON intent payload and publishes directly to the `fcm-notifications` topic in Google Cloud Pub/Sub.

2. **Notifications Service Routing (`services/notifications/src/index.ts` & `templates.ts`)**
   The notifications microservice intercepts the raw intent. It formats a `CROWD_ALERT_CRITICAL` template representing the high-density anomaly. It specifies `priority: high` to enforce visual un-muting. The notification invokes `admin.messaging().send()` targeting the scoped `venue-{venueId}-zone-{zoneId}` FCM topic.

3. **Attendee Experience Intake (`apps/attendee-app/lib/services/notification_service.dart`)**
   The newly injected `NotificationService` acts as the receiving node. It subscribes dynamically to venue locations and establishes the root OS background isolations:
    - Background payloads hit `_firebaseMessagingBackgroundHandler`.
    - Foreground payloads spawn real-time rendering.
    - User taps execute `_handleDeepLink`, navigating to the recommended AR route (`/home/map`).

By automating this three-tier pipeline, the venue can actively divert attendees away from emerging danger points (bottlenecks) entirely proactively.
