# Flutter App Profiling
**Status of Local Measurement:** [ENVIRONMENT-BLOCKED]
The `flutter run --profile` DevTools UI tracking cannot be verified by an autonomous AI agent in a headless terminal space.

## Production Monitoring Strategy
We will extract rendering matrices and widget states dynamically using:
1. **Firebase Performance Monitoring (FPM)**: Configured in the Flutter client to track App Start Time, Screen Rendering times (Slow Frames > 16ms, Frozen Frames > 700ms).
2. **ARCore Tracing**: 
   - We map the `ArSession` initialization span to an explicit FPM Custom Trace `ar_init_latency`, expecting ~200ms after applying optimizations.
3. **State Management Checks**:
   - QA Engineers will manually utilize the physical Flutter DevTools Widget Inspector on actual handheld devices to confirm `StreamProvider` rebuild scopes on queue mutations.
