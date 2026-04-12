import { 
  AttendeePersonalizationProfile, 
  DietaryPreference
} from './shared/types/attendee-personalization.types';
import { PersonalizedRecommendation } from './shared/types/personalization-recommendation.types';
import { QueueStatus, ZoneDensity } from './shared/types/crowd.types';

// Mock routing service
export interface RouteWaypoint {
  lat: number;
  lng: number;
}
export interface NavigationRoute {
  routeId: string;
  waypoints: RouteWaypoint[];
}

export class ProximityRecommendationEngine {
  
  // Called when attendee's zone changes
  async generateRecommendations(
    attendeeId: string,           // anonymized
    currentZoneId: string,
    venueId: string,
    profile: AttendeePersonalizationProfile,
    liveQueues: QueueStatus[],
    liveZones: ZoneDensity[]
  ): Promise<PersonalizedRecommendation[]> {
    
    const recommendations: PersonalizedRecommendation[] = [];
    
    // RECOMMENDATION TYPE 1: NEARBY SHORT QUEUE
    const nearbyShortQueues = liveQueues
      .filter(q => q.isOpen)
      .filter(q => q.estimatedWaitMinutes <= 8)
      .filter(q => this.isNearZone(q.coordinates, currentZoneId))
      .filter(q => this.matchesDietaryPrefs(q, profile.preferences))
      .filter(q => !profile.sessionSignals.stallsVisitedThisEvent.includes(q.stallId))  // Don't recommend visited
      .slice(0, 3);
    
    nearbyShortQueues.forEach(queue => {
      // Adding expiration time in 5 minutes
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5);
      
      recommendations.push({
        recommendationId: `rec-${Date.now()}-${queue.stallId}`,
        attendeeId: attendeeId,
        type: 'FOOD_STALL',
        payload: {
          title: `${queue.stallName} — only ${queue.estimatedWaitMinutes} min wait`,
          description: `${Math.round(queue.distanceMeters)}m away. ${queue.stallType === 'FOOD' ? 'Back in time for kickoff.' : ''}`,
          actionType: 'NAVIGATE',
          actionTarget: queue.stallId,
          confidence: this.calculateConfidence(queue, currentZoneId),
          expiresAt: expiresAt.toISOString()
        },
        reasoning: {
          factors: ['NEAR_SEAT', 'SHORT_QUEUE', 'DIETARY_MATCH'],
          primaryFactor: 'SHORT_QUEUE'
        },
        privacy: {
          basedOnLocation: true,
          basedOnHistory: profile.consent.behavioralSignals,
          basedOnPreferences: profile.preferences.dietaryRestrictions.length > 0
        }
      });
    });
    
    // RECOMMENDATION TYPE 2: AVOID CROWDED ROUTE
    const currentRoute = await this.getCurrentRoute(attendeeId);
    if (currentRoute) {
      const crowdedWaypoints = currentRoute.waypoints.filter(wp => {
        const zone = liveZones.find(z => this.waypointInZone(wp, z));
        return zone?.densityLevel === 'CRITICAL';
      });
      
      if (crowdedWaypoints.length > 0) {
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 2);
        
        recommendations.push({
          recommendationId: `rec-${Date.now()}-route`,
          attendeeId: attendeeId,
          type: 'ROUTE',
          payload: {
            title: "Alternate route available",
            description: "Your current route passes through a crowded area. A clearer path is available.",
            actionType: 'RECALCULATE',
            actionTarget: 'RECALCULATE',
            confidence: 0.9,
            expiresAt: expiresAt.toISOString()
          },
          reasoning: {
            factors: ['LOW_CROWD'],
            primaryFactor: 'LOW_CROWD'
          },
          privacy: {
            basedOnLocation: true,
            basedOnHistory: false,
            basedOnPreferences: false
          }
        });
      }
    }
    
    // Privacy safeguard: Recommendations are returned, not persisted at user level
    return recommendations
      .sort((a, b) => b.payload.confidence - a.payload.confidence)
      .slice(0, 3);
  }
  
  private matchesDietaryPrefs(
    queue: QueueStatus,
    prefs: AttendeePersonalizationProfile['preferences']
  ): boolean {
    if (!prefs.dietaryRestrictions || prefs.dietaryRestrictions.length === 0) return true;
    return this.stallMatchesDiet(queue.stallId, prefs.dietaryRestrictions);
  }

  private calculateConfidence(
    queue: QueueStatus,
    currentZoneId: string
  ): number {
    let score = 0.5;  // Base score
    
    if (queue.estimatedWaitMinutes <= 5) score += 0.3;
    else if (queue.estimatedWaitMinutes <= 10) score += 0.15;
    
    if (queue.distanceMeters <= 50) score += 0.2;
    else if (queue.distanceMeters <= 100) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  // MOCKS FOR ENGINE
  private isNearZone(coords: any, zoneId: string): boolean {
    return true; // Assume true for test
  }

  private stallMatchesDiet(stallId: string, restrictions: DietaryPreference[]): boolean {
    // Basic mock mapping
    if (restrictions.includes(DietaryPreference.VEGETARIAN) && stallId.includes('meat')) return false;
    return true; 
  }

  private async getCurrentRoute(attendeeId: string): Promise<NavigationRoute | null> {
    return null; // Mock return
  }

  private waypointInZone(wp: RouteWaypoint, zone: ZoneDensity): boolean {
    return false; // Mock calculation
  }
}
