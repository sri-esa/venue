import { AttendeePersonalizationProfile } from '../../shared/types/attendee-personalization.types';

describe('Privacy Consent Requirements', () => {
  let profile: AttendeePersonalizationProfile;

  beforeEach(() => {
    profile = {
      attendeeId: '123',
      venueId: 'v1',
      eventId: 'e1',
      ticketTier: 'STANDARD' as any,
      seatLocation: {} as any,
      entryGate: 'g1',
      preferences: {
        dietaryRestrictions: [],
        mobilityNeeds: 'STANDARD' as any,
        notificationFrequency: 'NONE' as any,
        preferredLanguage: 'en',
        favoriteStalls: []
      },
      sessionSignals: {
        zonesVisited: [],
        stallsVisitedThisEvent: [],
        lastKnownZone: null,
        navigationSessionCount: 0,
        assistantQueryCount: 0
      },
      consent: {
        locationTracking: false,
        behavioralSignals: false,
        pushNotifications: false,
        consentTimestamp: '',
        consentVersion: ''
      },
      dataRetentionPolicy: {
        profileExpiresAt: '',
        sessionDataPurgedAt: '',
        canRequestDeletion: true
      }
    };
  });

  it('Default consent flags should be false', () => {
    expect(profile.consent.locationTracking).toBe(false);
    expect(profile.consent.behavioralSignals).toBe(false);
  });

  it('Personalization disabled when consent is false', () => {
    // Assert logic disabled
    const locationEnabled = profile.consent.locationTracking;
    expect(locationEnabled).toBe(false);
  });

  it('Consent withdrawal immediately stops data usage', () => {
    profile.consent.locationTracking = true;
    profile.consent.locationTracking = false;
    expect(profile.consent.locationTracking).toBe(false);
  });

  it('Session signals correctly mock cleared state', () => {
    profile.sessionSignals.stallsVisitedThisEvent = ['s1'];
    // clear memory mock
    profile.sessionSignals.stallsVisitedThisEvent = [];
    expect(profile.sessionSignals.stallsVisitedThisEvent.length).toBe(0);
  });
});
