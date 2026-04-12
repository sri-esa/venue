import {
  AttendeePersonalizationProfile,
  DietaryPreference,
  MobilityNeed,
  NotificationFrequency,
  TicketTier,
} from '../../shared/types/attendee-personalization.types';
import { ProximityRecommendationEngine } from '../../services/crowd-density/src/recommendation_engine';

const buildProfile = (): AttendeePersonalizationProfile => ({
  attendeeId: 'anon_123',
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
    favoriteStalls: [],
  },
  sessionSignals: {
    zonesVisited: ['zone-1'],
    stallsVisitedThisEvent: [],
    lastKnownZone: 'zone-1',
    navigationSessionCount: 1,
    assistantQueryCount: 0,
  },
  consent: {
    locationTracking: true,
    behavioralSignals: true,
    pushNotifications: true,
    consentTimestamp: '2026-04-12T10:00:00.000Z',
    consentVersion: 'v2',
  },
  dataRetentionPolicy: {
    profileExpiresAt: '2026-05-12T18:00:00.000Z',
    sessionDataPurgedAt: '2026-04-12T18:01:00.000Z',
    canRequestDeletion: true,
  },
});

describe('Recommendation Engine Tests', () => {
  let engine: ProximityRecommendationEngine;
  let profile: AttendeePersonalizationProfile;

  beforeEach(() => {
    engine = new ProximityRecommendationEngine();
    profile = buildProfile();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should never recommend non-vegetarian stalls to vegetarian attendees', () => {
    expect((engine as any).stallMatchesDiet('meat-stall', [DietaryPreference.VEGETARIAN])).toBe(false);
  });

  it('should exclude stalls that were already visited in the current event', async () => {
    profile.sessionSignals.stallsVisitedThisEvent = ['stall-visited'];

    const recommendations = await engine.generateRecommendations(
      profile.attendeeId,
      'zone-1',
      'venue-1',
      profile,
      [
        {
          queueId: 'queue-1',
          stallId: 'stall-visited',
          stallName: 'Already Tried',
          stallType: 'FOOD',
          currentLength: 4,
          estimatedWaitMinutes: 5,
          isOpen: true,
          distanceMeters: 40,
          coordinates: [0, 0],
          occupancy: 0,
          densityLevel: 'LOW',
          rawCount: 0,
          capacity: 0,
          lastUpdated: '2026-04-12T10:00:00.000Z',
          sensorConfidence: 1,
        } as any,
        {
          queueId: 'queue-2',
          stallId: 'stall-fresh',
          stallName: 'Fresh Choice',
          stallType: 'FOOD',
          currentLength: 3,
          estimatedWaitMinutes: 4,
          isOpen: true,
          distanceMeters: 35,
          coordinates: [1, 1],
          occupancy: 0,
          densityLevel: 'LOW',
          rawCount: 0,
          capacity: 0,
          lastUpdated: '2026-04-12T10:00:00.000Z',
          sensorConfidence: 1,
        } as any,
      ],
      [],
    );

    expect(recommendations).toHaveLength(1);
    expect(recommendations[0].payload.actionTarget).toBe('stall-fresh');
  });

  it('should only return recommendations that are still unexpired', async () => {
    const recommendations = await engine.generateRecommendations(
      profile.attendeeId,
      'zone-1',
      'venue-1',
      profile,
      [
        {
          queueId: 'queue-1',
          stallId: 'stall-fresh',
          stallName: 'Fresh Choice',
          stallType: 'FOOD',
          currentLength: 3,
          estimatedWaitMinutes: 4,
          isOpen: true,
          distanceMeters: 35,
          coordinates: [1, 1],
        } as any,
      ],
      [],
    );

    expect(recommendations).toHaveLength(1);
    expect(new Date(recommendations[0].payload.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it('should cap the recommendation list at three items even when more matches exist', async () => {
    const recommendations = await engine.generateRecommendations(
      profile.attendeeId,
      'zone-1',
      'venue-1',
      { ...profile, preferences: { ...profile.preferences, dietaryRestrictions: [] } },
      [
        { queueId: 'q1', stallId: 'stall-1', stallName: 'A', stallType: 'FOOD', currentLength: 1, estimatedWaitMinutes: 4, isOpen: true, distanceMeters: 20, coordinates: [0, 0] } as any,
        { queueId: 'q2', stallId: 'stall-2', stallName: 'B', stallType: 'FOOD', currentLength: 1, estimatedWaitMinutes: 5, isOpen: true, distanceMeters: 25, coordinates: [0, 0] } as any,
        { queueId: 'q3', stallId: 'stall-3', stallName: 'C', stallType: 'FOOD', currentLength: 1, estimatedWaitMinutes: 6, isOpen: true, distanceMeters: 30, coordinates: [0, 0] } as any,
        { queueId: 'q4', stallId: 'stall-4', stallName: 'D', stallType: 'FOOD', currentLength: 1, estimatedWaitMinutes: 7, isOpen: true, distanceMeters: 35, coordinates: [0, 0] } as any,
      ],
      [],
    );

    expect(recommendations).toHaveLength(3);
  });

  it('should prioritize a critical route recommendation above food suggestions', async () => {
    jest.spyOn(engine as any, 'getCurrentRoute').mockResolvedValue({
      routeId: 'route-1',
      waypoints: [{ lat: 1, lng: 1 }],
    });
    jest.spyOn(engine as any, 'waypointInZone').mockReturnValue(true);

    const recommendations = await engine.generateRecommendations(
      profile.attendeeId,
      'zone-1',
      'venue-1',
      { ...profile, preferences: { ...profile.preferences, dietaryRestrictions: [] } },
      [
        { queueId: 'q1', stallId: 'stall-1', stallName: 'A', stallType: 'FOOD', currentLength: 1, estimatedWaitMinutes: 6, isOpen: true, distanceMeters: 60, coordinates: [0, 0] } as any,
      ],
      [
        { zoneId: 'zone-critical', venueId: 'venue-1', occupancy: 0.95, capacity: 100, densityLevel: 'CRITICAL', rawCount: 95, lastUpdated: '2026-04-12T10:00:00.000Z', sensorConfidence: 0.95 } as any,
      ],
    );

    expect(recommendations[0].type).toBe('ROUTE');
    expect(recommendations[0].payload.actionType).toBe('RECALCULATE');
  });

  it('should calculate recommendation confidence from wait time and distance', () => {
    const score = (engine as any).calculateConfidence({ estimatedWaitMinutes: 4, distanceMeters: 40 }, 'zone-1');

    expect(score).toBe(1);
  });
});
