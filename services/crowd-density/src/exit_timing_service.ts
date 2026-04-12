import { SeatLocation, TicketTier } from './shared/types/attendee-personalization.types';
import { ZoneDensity } from './shared/types/crowd.types';

export type TransportMode = 'PERSONAL_VEHICLE' | 'PUBLIC_TRANSPORT' | 'RIDESHARE' | 'WALKING';

export interface ExitRecommendation {
  recommendedGate: string;
  recommendedExitTime: string;
  alternativeGate: string | null;
  estimatedClearanceMinutes: number;
  transportAdvice: string;
  confidence: number;
}

export interface ExitWindow {
  bestTime: string;
  clearanceMinutes: number;
  confidence: number;
  alternativeGate: string | null;
}

export class ExitTimingService {
  
  // Called when event status transitions to ENDED
  async generateExitRecommendation(
    seatLocation: SeatLocation,
    ticketTier: TicketTier,
    venueId: string,
    liveExitZones: ZoneDensity[],
    transportMode: TransportMode
  ): Promise<ExitRecommendation> {
    
    // Find the best exit gate for this seat
    const recommendedGate = seatLocation.nearestGate;
    const gateZone = liveExitZones.find(z => z.zoneId === recommendedGate);
    
    // Calculate optimal exit window
    const exitWindow = this.calculateExitWindow(
      gateZone,
      ticketTier,
      transportMode
    );
    
    return {
      recommendedGate,
      recommendedExitTime: exitWindow.bestTime,
      alternativeGate: exitWindow.alternativeGate,
      estimatedClearanceMinutes: exitWindow.clearanceMinutes,
      transportAdvice: this.getTransportAdvice(transportMode, gateZone),
      confidence: exitWindow.confidence
    };
  }
  
  private calculateExitWindow(
    gateZone: ZoneDensity | undefined,
    ticketTier: TicketTier,
    transportMode: TransportMode
  ): ExitWindow {
    
    const currentDensity = gateZone?.densityLevel ?? 'UNKNOWN';
    
    // VIP/PREMIUM: dedicated exit gates, always recommend immediate
    if (ticketTier === TicketTier.VIP || ticketTier === TicketTier.PREMIUM) {
      return {
        bestTime: 'NOW',
        clearanceMinutes: 5,
        confidence: 0.9,
        alternativeGate: null
      };
    }
    
    // Standard: recommend based on gate density
    if (currentDensity === 'CRITICAL') {
      return {
        bestTime: 'WAIT_10_MIN',  // Wait for initial surge to clear
        clearanceMinutes: 10,
        confidence: 0.75,
        alternativeGate: this.findClearerGate(gateZone)
      };
    }
    
    return {
      bestTime: 'NOW',
      clearanceMinutes: this.estimateClearanceTime(gateZone),
      confidence: 0.85,
      alternativeGate: null
    };
  }
  
  private getTransportAdvice(
    mode: TransportMode,
    gateZone: ZoneDensity | undefined
  ): string {
    switch(mode) {
      case 'PUBLIC_TRANSPORT':
        return "Head to the metro entrance before the crowd peaks. Platform will be busy in ~15 minutes.";
      case 'RIDESHARE':
        return "Request your ride now — surge pricing starts in ~10 min as 50,000 attendees request simultaneously.";
      case 'PERSONAL_VEHICLE':
        return "Consider waiting 20 minutes before heading to parking. Exit traffic peaks immediately after the final whistle.";
      case 'WALKING':
        return `Walking routes are clear now. Head out via Gate ${gateZone?.zoneId ?? 'closest to you'} for the least crowded path.`;
    }
  }

  // MOCK HELPERS

  private findClearerGate(gateZone: ZoneDensity | undefined): string | null {
    if (!gateZone) return null;
    // Mock simulation: returning alternative gate logic
    return 'gate-south-alt'; 
  }

  private estimateClearanceTime(gateZone: ZoneDensity | undefined): number {
    return 15; // Mock simulation
  }
}
