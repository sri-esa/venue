# React Dashboard Profiling
**Status of Local Measurement:** [ENVIRONMENT-BLOCKED]
We cannot automate interaction with the React component visual DOM inspector for rendering metrics inside this terminal workspace.

## Production Monitoring Strategy
1. **React Developer Tools Profiler & Sentry**:
   - In the deployed Staff staging bounds, QA will record the flamegraph for the DataGrid table rendering when WebSockets pump update payloads at 50Hz.
2. **Zustand Mount Renders**:
   - Monitor `wdyr (why-did-you-render)` console dumps in the Webpack dev build to explicitly log which components suffer from zombie `useSelector` invalidations.
3. **Google Maps Overhead**:
   - Explicit Performance Observer traces will mark `maps_recolor_overlay` spans expecting `<16ms` budget.
