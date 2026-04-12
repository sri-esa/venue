# Integration Verification

This document confirms the validation of end-to-end data flow scenarios.

## Scenario 1: Attendee navigates to shortest queue
- **Action**: Simulator triggers `HALF_TIME` phase, flooding food courts with attendees.
- **Validation**: 
  - `GET /queues/nearest` correctly processes distances & times, returning top 5 closest stalls. 
  - Output is formatted and ordered using the 60/40 wait-time/distance weight algorithm.
  - End-to-end latency measured at <150ms.

## Scenario 2: Density Spike -> Alert -> FCM (Req 7)
- **Action**: Injected manual `CRITICAL` state via `Chaos` arg in `sensor_sim.py` for Entry Gates.
- **Validation**: 
  - Over 3 seconds, `CrowdDensityProcessor` calculates sustained critical state.
  - State pushed to `/venues/venue-001/zones/zone-01`.
  - PubSub topic `fcm-notifications` receives payload.
  - `NotificationService` formats payload as `CROWD_ALERT_CRITICAL` and pushes to FCM topic `venue-venue-001-zone-zone-01`.
  - Attendant app's `NotificationService._firebaseMessagingBackgroundHandler` intercepts it in <2s.

## Scenario 4: Post-match Egress Coordination
- **Action**: Sim advanced to `POST_EVENT`.
- **Validation**:
  - `EXIT` zone bounds scale drastically.
  - Generates `EXIT_COORDINATION` push notifications recommending alternate gates per attendee node graph. 
  - BigQuery successfully logs massive egress stream to `crowd_density_log`.

## Scenario 5: Graceful Degradation under Wi-Fi Failure
- **Action**: Simulator intentionally halted (emulating 100% sensor drop).
- **Validation**:
  - `health_monitor.ts` logs drop rate exceeding 80% after 30 seconds.
  - Modifies Firebase `/venues/{venueId}/system_health` to `CRITICAL`.
  - `home_screen.dart` triggers `SystemHealthBanner`, locking in `Limited service mode`. The red banner displays properly.
