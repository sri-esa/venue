# Consolidated Firestore Schema v2

COLLECTION STRUCTURE:
(previously split between RTDB + Firestore — now unified)

venues (collection)
└── {venueId} (document)
    ├── name, capacity, status, coordinates
    ├── zones (subcollection)  ← was RTDB /venues/{id}/zones/
    │   └── {zoneId} (document)
    │       ├── zoneId, occupancy, capacity
    │       ├── densityLevel, rawCount
    │       ├── lastUpdated, sensorConfidence
    │       └── connectedZones[]
    ├── queues (subcollection) ← was RTDB /venues/{id}/queues/
    │   └── {queueId} (document)
    │       ├── queueId, stallId, stallName, stallType
    │       ├── currentLength, estimatedWaitMinutes
    │       ├── isOpen, coordinates, lastUpdated
    │       └── overrideExpiresAt (nullable)
    ├── alerts (subcollection) ← was RTDB /venues/{id}/alerts/
    │   └── {alertId} (document)
    │       ├── alertId, type, severity
    │       ├── zoneId, message
    │       ├── triggeredAt, resolvedAt (nullable)
    │       └── assignedTo (nullable)
    └── system_health (document) ← was RTDB path
        ├── state: HEALTHY|DEGRADED|PARTIAL|CRITICAL
        └── updatedAt

staff (collection)          ← was RTDB /staff/
└── {staffId} (document)
    ├── staffId, name, role, venueId
    ├── location: {lat, lng, updatedAt}
    ├── assignments[] 
    └── isOnDuty, deviceToken

analytics (collection)      ← was Firestore (unchanged path)
└── {venueId} (document)
    └── realtime (subcollection)
        └── current (document)
            ├── totalAttendees, percentCapacity
            ├── criticalZonesCount, avgQueueWaitMinutes
            ├── longestQueueMinutes, activeAlertsCount
            └── updatedAt
