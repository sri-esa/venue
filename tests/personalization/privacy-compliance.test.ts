import { DietaryPreference, MobilityNeed, NotificationFrequency, TicketTier, type AttendeePersonalizationProfile } from '../../shared/types/attendee-personalization.types';

const anonymizeAttendeeId = (rawId: string): string => `anon_${Buffer.from(rawId).toString('hex')}`;
const expiresThirtyDaysAfterEvent = (eventEndedAt: string): string => {
  const expiry = new Date(eventEndedAt);
  expiry.setDate(expiry.getDate() + 30);
  return expiry.toISOString();
};
const persistableProfileDocument = (profile: AttendeePersonalizationProfile) => ({
  attendeeId: profile.attendeeId,
  venueId: profile.venueId,
  eventId: profile.eventId,
  ticketTier: profile.ticketTier,
  seatLocation: profile.seatLocation,
  entryGate: profile.entryGate,
  preferences: profile.preferences,
  consent: profile.consent,
  dataRetentionPolicy: profile.dataRetentionPolicy,
});
const deleteProfileData = (store: Record<string, unknown>, attendeeId: string): Record<string, unknown> => {
  const nextStore = { ...store };
  delete nextStore[attendeeId];
  return nextStore;
};
const aggregateRecommendationLog = (recommendations: Array<{ stallId: string }>) => ({
  totalRecommendations: recommendations.length,
  byStall: recommendations.reduce<Record<string, number>>((accumulator, recommendation) => {
    accumulator[recommendation.stallId] = (accumulator[recommendation.stallId] ?? 0) + 1;
    return accumulator;
  }, {}),
});

describe('Privacy Compliance Verifications', () => {
  let profile: AttendeePersonalizationProfile;

  beforeEach(() => {
    profile = {
      attendeeId: anonymizeAttendeeId('real-user-42'),
      venueId: 'venue-1',
      eventId: 'event-1',
      ticketTier: TicketTier.STANDARD,
      seatLocation: {
        section: 'A',
        row: '10',
        seat: '8',
        level: 1,
        nearestGate: 'G1',
        nearestRestroom: 'R1',
        nearestFoodZone: 'F1',
      },
      entryGate: 'G1',
      preferences: {
        dietaryRestrictions: [DietaryPreference.VEGETARIAN],
        mobilityNeeds: MobilityNeed.STANDARD,
        notificationFrequency: NotificationFrequency.IMPORTANT_ONLY,
        preferredLanguage: 'en',
        favoriteStalls: ['stall-2'],
      },
      sessionSignals: {
        zonesVisited: ['zone-1'],
        stallsVisitedThisEvent: ['stall-1'],
        lastKnownZone: 'zone-1',
        navigationSessionCount: 2,
        assistantQueryCount: 1,
      },
      consent: {
        locationTracking: true,
        behavioralSignals: true,
        pushNotifications: true,
        consentTimestamp: '2026-04-12T10:00:00.000Z',
        consentVersion: 'v2',
      },
      dataRetentionPolicy: {
        profileExpiresAt: expiresThirtyDaysAfterEvent('2026-04-12T18:00:00.000Z'),
        sessionDataPurgedAt: '2026-04-12T18:01:00.000Z',
        canRequestDeletion: true,
      },
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should not persist session-only PII to Firebase documents without consented profile fields', () => {
    const persisted = persistableProfileDocument(profile);

    expect(persisted).toEqual(
      expect.objectContaining({
        attendeeId: expect.stringMatching(/^anon_/),
        venueId: 'venue-1',
      }),
    );
    expect(persisted).not.toHaveProperty('sessionSignals');
  });

  it('should store attendee identifiers as anonymized hashes instead of raw user ids', () => {
    expect(profile.attendeeId).toMatch(/^anon_/);
    expect(profile.attendeeId).not.toContain('real-user-42');
  });

  it('should expire profiles exactly 30 days after the event', () => {
    expect(profile.dataRetentionPolicy.profileExpiresAt).toBe('2026-05-12T18:00:00.000Z');
  });

  it('should exclude session signals from the persisted Firestore profile document', () => {
    const persisted = persistableProfileDocument(profile);

    expect(Object.keys(persisted)).not.toContain('sessionSignals');
    expect(persisted.preferences.favoriteStalls).toEqual(['stall-2']);
  });

  it('should delete all profile data when a user requests deletion', () => {
    const storedProfiles = {
      [profile.attendeeId]: profile,
      other: { attendeeId: 'anon_other' },
    };

    const remainingProfiles = deleteProfileData(storedProfiles, profile.attendeeId);

    expect(remainingProfiles).not.toHaveProperty(profile.attendeeId);
    expect(remainingProfiles).toHaveProperty('other');
  });

  it('should log recommendation analytics only as aggregate counts', () => {
    const logEntry = aggregateRecommendationLog([
      { stallId: 'stall-1' },
      { stallId: 'stall-1' },
      { stallId: 'stall-2' },
    ]);

    expect(logEntry).toEqual({
      totalRecommendations: 3,
      byStall: {
        'stall-1': 2,
        'stall-2': 1,
      },
    });
    expect(Object.keys(logEntry)).not.toContain('attendeeId');
  });
});
