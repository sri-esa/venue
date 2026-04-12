import {
  AttendeePersonalizationProfile,
  MobilityNeed,
  NotificationFrequency,
  TicketTier,
} from '../../shared/types/attendee-personalization.types';

const isPersonalizationEnabled = (profile: AttendeePersonalizationProfile): boolean =>
  profile.consent.locationTracking || profile.consent.behavioralSignals || profile.consent.pushNotifications;

const withdrawConsent = (profile: AttendeePersonalizationProfile): AttendeePersonalizationProfile => ({
  ...profile,
  consent: {
    ...profile.consent,
    locationTracking: false,
    behavioralSignals: false,
    pushNotifications: false,
  },
  sessionSignals: {
    ...profile.sessionSignals,
    zonesVisited: [],
    stallsVisitedThisEvent: [],
    lastKnownZone: null,
    navigationSessionCount: 0,
    assistantQueryCount: 0,
  },
});

describe('Privacy Consent Requirements', () => {
  let profile: AttendeePersonalizationProfile;

  beforeEach(() => {
    profile = {
      attendeeId: 'anon_123',
      venueId: 'v1',
      eventId: 'e1',
      ticketTier: TicketTier.STANDARD,
      seatLocation: {
        section: 'A',
        row: '2',
        seat: '10',
        level: 1,
        nearestGate: 'g1',
        nearestRestroom: 'r1',
        nearestFoodZone: 'f1',
      },
      entryGate: 'g1',
      preferences: {
        dietaryRestrictions: [],
        mobilityNeeds: MobilityNeed.STANDARD,
        notificationFrequency: NotificationFrequency.NONE,
        preferredLanguage: 'en',
        favoriteStalls: [],
      },
      sessionSignals: {
        zonesVisited: [],
        stallsVisitedThisEvent: [],
        lastKnownZone: null,
        navigationSessionCount: 0,
        assistantQueryCount: 0,
      },
      consent: {
        locationTracking: false,
        behavioralSignals: false,
        pushNotifications: false,
        consentTimestamp: '',
        consentVersion: '',
      },
      dataRetentionPolicy: {
        profileExpiresAt: '',
        sessionDataPurgedAt: '',
        canRequestDeletion: true,
      },
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should default all consent flags to false', () => {
    expect(profile.consent).toEqual({
      locationTracking: false,
      behavioralSignals: false,
      pushNotifications: false,
      consentTimestamp: '',
      consentVersion: '',
    });
  });

  it('should keep personalization disabled when no consent is granted', () => {
    expect(isPersonalizationEnabled(profile)).toBe(false);
  });

  it('should stop personalization immediately after consent is withdrawn', () => {
    profile.consent.locationTracking = true;
    profile.consent.behavioralSignals = true;

    const withdrawn = withdrawConsent(profile);

    expect(isPersonalizationEnabled(withdrawn)).toBe(false);
    expect(withdrawn.consent.locationTracking).toBe(false);
    expect(withdrawn.consent.behavioralSignals).toBe(false);
  });

  it('should clear session signals when consent is withdrawn', () => {
    profile.sessionSignals.stallsVisitedThisEvent = ['s1', 's2'];
    profile.sessionSignals.lastKnownZone = 'zone-9';

    const withdrawn = withdrawConsent(profile);

    expect(withdrawn.sessionSignals.stallsVisitedThisEvent).toEqual([]);
    expect(withdrawn.sessionSignals.lastKnownZone).toBeNull();
    expect(withdrawn.sessionSignals.navigationSessionCount).toBe(0);
  });
});
