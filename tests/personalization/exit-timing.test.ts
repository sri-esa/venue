import { ExitTimingService, TransportMode } from '../../services/crowd-density/src/exit_timing_service';
import { TicketTier } from '../../shared/types/attendee-personalization.types';

describe('Exit Timing Tests', () => {
  it('VIP ticket always returns bestTime: NOW', async () => {
    const service = new ExitTimingService();
    const result = await service.generateExitRecommendation(
      { nearestGate: 'g1' } as any,
      TicketTier.VIP,
      'v1',
      [],
      'WALKING'
    );
    expect(result.recommendedExitTime).toBe('NOW');
  });

  it('CRITICAL gate density returns WAIT_10_MIN', async () => {
    const service = new ExitTimingService();
    const result = await service.generateExitRecommendation(
      { nearestGate: 'g1' } as any,
      TicketTier.STANDARD,
      'v1',
      [{ zoneId: 'g1', densityLevel: 'CRITICAL' } as any],
      'WALKING'
    );
    expect(result.recommendedExitTime).toBe('WAIT_10_MIN');
  });

  it('Transport advice varies by transport mode', () => {
    const service = new ExitTimingService();
    const walking = service['getTransportAdvice']('WALKING', undefined);
    const ride = service['getTransportAdvice']('RIDESHARE', undefined);
    expect(walking).not.toBe(ride);
  });
});
