// shared/types/attendee-personalization.types.ts

// Since we cannot modify AttendeeProfile directly, we import if applicable, or assume it extends the base entity implicitly if not defined here.
// Assuming basic placeholder for AttendeeProfile if it's imported from another file, but we'll declare it standalone per instructions.

export enum TicketTier {
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
  VIP = 'VIP',
  ACCESSIBLE = 'ACCESSIBLE'
}

export enum DietaryPreference {
  VEGETARIAN = 'VEGETARIAN',
  VEGAN = 'VEGAN',
  HALAL = 'HALAL',
  KOSHER = 'KOSHER',
  GLUTEN_FREE = 'GLUTEN_FREE',
  NONE = 'NONE'
}

export enum MobilityNeed {
  STANDARD = 'STANDARD',
  WHEELCHAIR = 'WHEELCHAIR',
  LIMITED_MOBILITY = 'LIMITED_MOBILITY',
  VISUAL_IMPAIRMENT = 'VISUAL_IMPAIRMENT'
}

export enum NotificationFrequency {
  ALL = 'ALL',
  IMPORTANT_ONLY = 'IMPORTANT_ONLY',
  NONE = 'NONE'
}

export interface SeatLocation {
  section: string;
  row: string;
  seat: string;
  level: number;           // Floor level for AR navigation
  nearestGate: string;     // Pre-computed nearest entry/exit gate
  nearestRestroom: string; // Pre-computed nearest restroom
  nearestFoodZone: string; // Pre-computed nearest food court zone
}

export interface AttendeePersonalizationProfile {
  attendeeId: string;           // anonymized hash of real UID
  venueId: string;
  eventId: string;
  
  // TICKET & SEAT CONTEXT
  ticketTier: TicketTier;       // STANDARD | PREMIUM | VIP | ACCESSIBLE
  seatLocation: SeatLocation;   // {section, row, seat, level, zone}
  entryGate: string;            // Nearest recommended entry gate
  
  // PREFERENCES (all opt-in, default: null = not set)
  preferences: {
    dietaryRestrictions: DietaryPreference[];
    mobilityNeeds: MobilityNeed;
    notificationFrequency: NotificationFrequency;
    preferredLanguage: string;  // BCP-47 language code
    favoriteStalls: string[];   // stallIds attendee has saved
  };
  
  // BEHAVIORAL SIGNALS (session-only, never persisted)
  // These exist only in memory during the event
  // Cleared on app close — never written to Firestore
  sessionSignals: {
    zonesVisited: string[];        // zoneIds visited this session
    stallsVisitedThisEvent: string[]; // stallIds visited
    lastKnownZone: string | null;
    navigationSessionCount: number;
    assistantQueryCount: number;
  };
  
  // CONSENT FLAGS (required before any personalization)
  consent: {
    locationTracking: boolean;     // Required for proximity features
    behavioralSignals: boolean;    // Required for session signals
    pushNotifications: boolean;    // Required for proactive alerts
    consentTimestamp: string;      // ISO8601 when consent was given
    consentVersion: string;        // Version of privacy policy agreed to
  };
  
  // PRIVACY METADATA
  dataRetentionPolicy: {
    profileExpiresAt: string;      // 30 days after event (DPDP Act)
    sessionDataPurgedAt: string;   // Immediately on app close
    canRequestDeletion: boolean;   // Always true (DPDP Act right)
  };
}
