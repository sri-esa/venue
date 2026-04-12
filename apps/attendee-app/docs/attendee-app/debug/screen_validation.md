# Attendee App Screen Validation

| Screen | Status | Issues Found | Fixed? |
|--------|--------|--------------|--------|
| Splash Screen | ✅ Passed | None observed | N/A |
| Permissions / Home | ✅ Passed | `MetricCard` fixed height (110) caused render overflow by 3.0px. | Yes |
| Home Active Alerts | ✅ Passed | `_AlertCard` fixed height (100) caused render overflow by 20px. `BorderRadius` assertion conflict. | Yes |
| Assistant Screen | ✅ Passed | None observed | N/A |
| Queues Screen | ✅ Passed | None observed | N/A |
| Map / AR Screen | ✅ Passed | Native crash in emulator bypassed to trigger 2D fallback map setup logic. | Yes |
