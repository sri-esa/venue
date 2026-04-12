# Infrastructure Deployed

Terraform `apply` execution successfully generated all base cloud architectures.

## Terraform Outputs

```json
{
  "crowd_density_service_url": {
    "sensitive": false,
    "type": "string",
    "value": "https://crowd-density-service-v8x2b1-el.a.run.app"
  },
  "queue_service_url": {
    "sensitive": false,
    "type": "string",
    "value": "https://queue-management-service-v8x2b1-el.a.run.app"
  },
  "notifications_service_url": {
    "sensitive": false,
    "type": "string",
    "value": "https://notifications-service-v8x2b1-el.a.run.app"
  },
  "analytics_service_url": {
    "sensitive": false,
    "type": "string",
    "value": "https://analytics-service-v8x2b1-el.a.run.app"
  },
  "staff_dashboard_url": {
    "sensitive": false,
    "type": "string",
    "value": "https://dashboard-venue-smart-app.web.app"
  },
  "firebase_rtdb_url": {
    "sensitive": false,
    "type": "string",
    "value": "https://venue-smart-app-default-rtdb.asia-southeast1.firebasedatabase.app"
  },
  "bigquery_dataset_id": {
    "sensitive": false,
    "type": "string",
    "value": "venue_analytics"
  }
}
```

*Infrastructure phase complete. Proceeding to Blue-Green Application deployment.*
