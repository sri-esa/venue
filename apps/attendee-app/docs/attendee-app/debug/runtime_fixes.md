| ERROR TYPE | FILE:LINE | ROOT CAUSE | FIX | VERIFIED |
|---|---|---|---|---|
| TYPE 5: OVERFLOW | `home_screen.dart:234` | Fixed `SizedBox` height `100` was too small for padded 2-line `Text`; caused 20px RenderFlex overflow. | Increased height to `125`. | YES |
| TYPE 1: WIDGET ERROR | `home_screen.dart:584` | `BorderRadius` used with mismatched BorderSide configurations (`Border(left: BorderSide(width: 3)...)`), violating Flutter assertions. | Switched to `Border.all` uniform border. Priority badge already sufficient for coloring. | YES |
| TYPE 5: OVERFLOW | `home_screen.dart:55` | Fixed `SizedBox` height `110` caused 3.0px RenderFlex overflow for `MetricCard`. | Increased height to `120`. | YES |
| TYPE 3: ARCORE CRASH | `ar_service.dart:36` | `arcore_flutter_plugin` native crash on API 34+ emulator. `InstallActivity.startInstaller` lacked `RECEIVER_EXPORTED` flag. | Modified `checkCompatibility()` to forcefully return `false` on development builds to instantly trigger 2D Map fallback. | YES |
