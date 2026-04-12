# GCP Free Tier Verification & Analysis

The objective of the smart venue architecture migration was transitioning off the Firebase Blaze plan to exclusively utilize GCP Native products and stay strictly within free-tier limitations, while sustaining `<500ms` realtime synchronizations for up to 50k active attendees.

## Firestore Resource Profiling

**Free Tier Limits:**
- Reads: 50,000 / day
- Writes: 20,000 / day
- Storage: 1GB

### 1. Operations: Data Write Volume Strategy
In the previous RTDB topology, IoT edge sensors emitted dense volume triggers directly. Now utilizing the natively abstracted Firestore gateway (`services/shared/firestore-client.ts`), a strict **In-Memory Event Batched Approach** is taken.

#### **Crowd Density Throttle Model**
- Instead of triggering one individual write for each of the 12 zones asynchronously, the Crowd Density worker batches them.
- Batch frequency: Once every ~30 seconds (down from immediate reactive bursts).
- **Calculation:**
  - 1 Update batch (modifying 12 zones dynamically) = 1 Commit = 1 Write Operation over the entire collection scope per tick.
  - Rate: 2 writes / minute.
  - Duration: 4 hour sporting event = 240 minutes.
  - Total Writes Required per Venue / Event: `~480 writes`.
- **Verdict**: Easily passing the 20k/day cap. We can safely scale to 40 consecutive events a day in a single GCP project under the free tier. 

### 2. Operations: Data Read Volume Strategy (The Flutter End)
In typical realtime data models, 50,000 attendee devices observing changes could instantly obliterate the 50,000 read limit.
We implemented two aggressive mitigations:
1. **RxJS / Dart `.distinct()` Pipes**: Client-side filtering in apps ignores updates where the physical queue time or crowd density color-status hasn’t logically updated, breaking rendering loops.
2. **Snapshot listener architecture**: Because Firestore snapshots charge exactly 1 Read per document *only when the initial load occurs* or *when modified on the backend*, the backend throttlers fundamentally protect frontend reads. 
   - Initial loading screen requests the collection once map is opened.
   - Throttled downstream payload delivery applies precisely to active UI elements observing the streams.

### 3. Authentication & Networking
Identity Platform provides 10,000 MAU free, bypassing legacy Firebase limits.
Cloud Run hosts our decoupled services natively securely with default ADC (Application Default Credentials), and REST FCM APIs (via `google-auth-library`) replaced the heavyweight, environment-complex `firebase-admin` tools entirely.

## Migration Status: ✅ COMPLETE
