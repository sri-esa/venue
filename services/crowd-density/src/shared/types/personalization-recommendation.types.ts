export type RecommendationType = 'FOOD_STALL' | 'ROUTE' | 'EXIT_TIMING' | 'NOTIFICATION' | 'ACCESSIBILITY';

export type ActionType = 'NAVIGATE' | 'DISMISS' | 'SAVE' | 'NOTIFY_WHEN_SHORT' | 'RECALCULATE';

export type RecommendationFactor = 
  | 'NEAR_SEAT' 
  | 'SHORT_QUEUE' 
  | 'DIETARY_MATCH' 
  | 'LOW_CROWD' 
  | 'TICKET_TIER' 
  | 'PAST_VISIT' 
  | 'ACCESSIBILITY_ROUTE';

export interface PersonalizedRecommendation {
  recommendationId: string;
  attendeeId: string;        // anonymized hash
  type: RecommendationType;
  // FOOD_STALL | ROUTE | EXIT_TIMING | NOTIFICATION | ACCESSIBILITY
  
  payload: {
    title: string;           // "Try this stall — short queue!"
    description: string;     // 1-2 sentence explanation
    actionType: ActionType;  // NAVIGATE | DISMISS | SAVE | NOTIFY_WHEN_SHORT
    actionTarget: string;    // stallId | zoneId | route
    confidence: number;      // 0.0-1.0 how confident the recommendation is
    expiresAt: string;       // Recommendations are time-limited
  };
  
  reasoning: {
    factors: RecommendationFactor[];
    // NEAR_SEAT | SHORT_QUEUE | DIETARY_MATCH | LOW_CROWD |
    // TICKET_TIER | PAST_VISIT | ACCESSIBILITY_ROUTE
    primaryFactor: RecommendationFactor;
  };
  
  privacy: {
    basedOnLocation: boolean;      // true if uses current location
    basedOnHistory: boolean;       // true if uses session signals
    basedOnPreferences: boolean;   // true if uses saved preferences
    // Shown to attendee so they understand why recommended
  };
}
