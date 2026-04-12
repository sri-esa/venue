// Dart translation of shared/types/attendee-personalization.types.ts
// Owner: Attendee App Team

/// Ticket tier classification
enum TicketTier {
  standard,
  premium,
  vip,
  accessible,
}

/// Dietary preference flags — all opt-in
enum DietaryPreference {
  vegetarian,
  vegan,
  halal,
  kosher,
  glutenFree,
  none,
}

/// Mobility need classification affects route planning and AR navigation
enum MobilityNeed {
  standard,
  wheelchair,
  limitedMobility,
  visualImpairment,
}

/// How frequently the attendee wants to receive push notifications
enum NotificationFrequency {
  all,
  importantOnly,
  none,
}

/// Seat location with pre-computed proximity data
/// Maps to SeatLocation in shared/types/attendee-personalization.types.ts
class SeatLocation {
  final String section;
  final String row;
  final String seat;
  final int level; // Floor level for AR navigation
  final String nearestGate; // Pre-computed nearest entry/exit gate
  final String nearestRestroom; // Pre-computed nearest restroom
  final String nearestFoodZone; // Pre-computed nearest food court zone

  const SeatLocation({
    required this.section,
    required this.row,
    required this.seat,
    required this.level,
    required this.nearestGate,
    required this.nearestRestroom,
    required this.nearestFoodZone,
  });

  /// Human-readable seat string e.g. "Section 12, Row G, Seat 14"
  String get displayString => 'Section $section, Row $row, Seat $seat';

  factory SeatLocation.fromJson(Map<String, dynamic> json) {
    return SeatLocation(
      section: json['section'] as String,
      row: json['row'] as String,
      seat: json['seat'] as String,
      level: (json['level'] as num).toInt(),
      nearestGate: json['nearestGate'] as String,
      nearestRestroom: json['nearestRestroom'] as String,
      nearestFoodZone: json['nearestFoodZone'] as String,
    );
  }

  Map<String, dynamic> toJson() => {
    'section': section,
    'row': row,
    'seat': seat,
    'level': level,
    'nearestGate': nearestGate,
    'nearestRestroom': nearestRestroom,
    'nearestFoodZone': nearestFoodZone,
  };
}

/// Attendee preferences — all opt-in, default: not set
class AttendeePreferences {
  final List<DietaryPreference> dietaryRestrictions;
  final String mobilityNeeds; // String to match gemini_service.dart usage
  final NotificationFrequency notificationFrequency;
  final String preferredLanguage; // BCP-47 language code
  final List<String> favoriteStalls; // stallIds attendee has saved

  const AttendeePreferences({
    this.dietaryRestrictions = const [],
    this.mobilityNeeds = 'STANDARD',
    this.notificationFrequency = NotificationFrequency.importantOnly,
    this.preferredLanguage = 'en',
    this.favoriteStalls = const [],
  });
}

/// Behavioral session signals — never persisted, cleared on app close
class SessionSignals {
  final List<String> zonesVisited;
  final List<String> stallsVisitedThisEvent;
  final String? lastKnownZone;
  final int navigationSessionCount;
  final int assistantQueryCount;

  const SessionSignals({
    this.zonesVisited = const [],
    this.stallsVisitedThisEvent = const [],
    this.lastKnownZone,
    this.navigationSessionCount = 0,
    this.assistantQueryCount = 0,
  });
}

/// Consent flags — required before any personalization feature activates
class ConsentFlags {
  final bool locationTracking; // Required for proximity features
  final bool behavioralSignals; // Required for session signals
  final bool pushNotifications; // Required for proactive alerts
  final String consentTimestamp; // ISO8601 when consent was given
  final String consentVersion; // Version of privacy policy agreed to

  const ConsentFlags({
    this.locationTracking = false,
    this.behavioralSignals = false,
    this.pushNotifications = false,
    this.consentTimestamp = '',
    this.consentVersion = '1.0',
  });

  /// Returns true if the attendee has granted any personalization consent
  bool get hasAnyConsent => locationTracking || behavioralSignals || pushNotifications;
}

/// Full attendee personalization profile
/// Maps to AttendeePersonalizationProfile in shared/types/attendee-personalization.types.ts
class AttendeePersonalizationProfile {
  final String attendeeId; // anonymized hash of real UID
  final String venueId;
  final String eventId;

  // Ticket & seat context
  final TicketTier ticketTier;
  final SeatLocation? seatLocation; // nullable — not all tickets have assigned seats
  final String entryGate;

  // Preferences (all opt-in)
  final AttendeePreferences preferences;

  // Behavioral signals (session-only, never persisted)
  final SessionSignals sessionSignals;

  // Consent (required before any personalization)
  final ConsentFlags consent;

  const AttendeePersonalizationProfile({
    required this.attendeeId,
    required this.venueId,
    required this.eventId,
    this.ticketTier = TicketTier.standard,
    this.seatLocation,
    this.entryGate = '',
    this.preferences = const AttendeePreferences(),
    this.sessionSignals = const SessionSignals(),
    this.consent = const ConsentFlags(),
  });
}
