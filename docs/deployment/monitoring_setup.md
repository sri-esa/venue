# Production Monitoring Policies & Alerts

Deployment verified the installation of robust SLA tracking triggers.

## Monitored Alerting Policies Extracted

| Alert Ref | Condition State | Severity | Notification Channel |
|-----------|-----------------|----------|----------------------|
| **ALERT-1: SERVICE DOWN** | Service `/health` bounds fail > 2 min. | `CRITICAL` | PagerDuty, SMS |
| **ALERT-2: HIGH ERROR RATE** | API endpoints return > 1% 5xx over 5 min. | `HIGH` | Slack, Email |
| **ALERT-3: RTDB LATENCY SPIKE** | RTDB connection latency exceeds 500ms bounds. | `MEDIUM` | Slack |
| **ALERT-4: GEMINI API ERRORS** | External limit threshold throws `ResourceExhausted` > 5%. | `MEDIUM` | Slack |
| **ALERT-5: BUDGET THRESHOLD** | Current $500 monthly budget crosses 50%, 90%. | `MONITOR` | Email |
| **ALERT-6: PUB/SUB DEAD LETTERS**| Pipeline buffer DLQ exceeds 100 dead rows. | `HIGH` | Slack, Email |

## Custom Log-Based Metrics Filtered
The exact extraction vectors successfully map native app/stream events to Dashboard JSON arrays:
- **`alert_pipeline_latency`**: Extracts `alert_pipeline_latency_ms` matching SLA limits.
- **`gemini_cache_hit_rate`**: Validates boolean map tracking context overrides cleanly.
- **`fcm_delivery_success`**: Maps outbound Cloud Messaging acknowledgments dynamically measuring the 95% threshold constraint.
