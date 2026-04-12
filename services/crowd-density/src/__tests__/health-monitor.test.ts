const probeSetMock = jest.fn();
const currentSetMock = jest.fn();

jest.mock('../shared/firestore-client', () => ({
  db: {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn((docId: string) => {
      if (docId === 'latency_probe') {
        return { set: probeSetMock };
      }

      if (docId === 'current') {
        return { set: currentSetMock };
      }

      return {
        collection: jest.fn().mockReturnThis(),
        doc: jest.fn((nestedId: string) => {
          if (nestedId === 'latency_probe') return { set: probeSetMock };
          if (nestedId === 'current') return { set: currentSetMock };
          return { set: jest.fn() };
        }),
      };
    }),
  },
}));

import { HealthMonitor } from '../health_monitor';

describe('HealthMonitor', () => {
  let monitor: HealthMonitor;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-12T12:00:00.000Z'));
    probeSetMock.mockReset().mockResolvedValue(undefined);
    currentSetMock.mockReset().mockResolvedValue(undefined);
    monitor = new HealthMonitor('venue-test');
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should transition to DEGRADED when sensor dropout reaches 20 percent', async () => {
    for (let i = 1; i <= 9; i += 1) {
      monitor.recordSensorActivity(`sensor-${i}`);
    }

    await monitor.checkHealth();

    expect((monitor as any).currentState).toBe('DEGRADED');
    expect(currentSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        state: 'DEGRADED',
      }),
    );
  });

  it('should transition to CRITICAL when sensor dropout reaches 80 percent', async () => {
    for (let i = 1; i <= 2; i += 1) {
      monitor.recordSensorActivity(`sensor-${i}`);
    }

    await monitor.checkHealth();

    expect((monitor as any).currentState).toBe('CRITICAL');
    expect(currentSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        state: 'CRITICAL',
      }),
    );
  });

  it('should stay HEALTHY when all expected sensors are active and latency is normal', async () => {
    for (let i = 1; i <= 12; i += 1) {
      monitor.recordSensorActivity(`sensor-${i}`);
    }

    await monitor.checkHealth();

    expect((monitor as any).currentState).toBe('HEALTHY');
    expect(currentSetMock).not.toHaveBeenCalled();
    expect(probeSetMock).toHaveBeenCalledTimes(1);
  });
});
