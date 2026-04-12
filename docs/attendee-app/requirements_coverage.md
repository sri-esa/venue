# Attendee App: Requirements Coverage Matrix

| Req # | Phase 1 SHALL Statement | Component / Implementation Boundary | Status |
|---|---|---|---|
| 1 | The system SHALL provide live zone densities. | `home_screen.dart` / `FirebaseService.watchVenueZones` | ✅ MET |
| 2 | The system SHALL calculate and predict vendor wait times. | `queue_list_screen.dart` / `queue_status.dart` | ✅ MET |
| 3 | The system SHALL provide AR wayfinding overlay routing. | `ar_navigation_screen.dart` / `ar_service.dart` | ✅ MET |
| 4 | The system SHALL deploy an NLP attendee assistant. | `assistant_screen.dart` / `gemini_service.dart` | ✅ MET |
| 5 | The system SHALL gracefully degrade to offline 2D maps. | `ar_navigation_screen.dart` `_buildFallback2DMap()` | ✅ MET |
| 6 | The system SHALL synchronize live updates under 500ms. | `firebase_service.dart` (RTDB WebSocket streams) | ✅ MET |
| 7 | The system SHALL push proactive/predictive ingress alerts. | `lib/features/alerts/` (FCM Integration lacking) | ❌ [UNMET REQUIREMENT] |

*Note: Requirements 8, 9, and 10 from Phase 1 map exclusively to IoT Edge logic, Staff Dashboards, and Post-Event Data Pipelines respectively, and are thus excluded from this Attendee-Facing Mobile App coverage map.*

### Deficit Analysis
The "Predictive Ingress Alerts" requirement (Req 7) was scaffolded conceptually in the application router and folder structure, but the explicit `FirebaseMessaging` foreground/background orchestration logic connecting to an `AlertsScreen` was not fully materialized in the code written during the 9-part generation batch. This represents an active gap requiring development mapping.
