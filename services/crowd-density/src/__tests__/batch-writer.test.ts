jest.mock('@google-cloud/pubsub', () => ({
  PubSub: jest.fn().mockImplementation(() => ({
    topic: jest.fn(() => ({ publishMessage: jest.fn().mockResolvedValue(undefined) })),
  })),
}));

jest.mock('../shared/firestore-client', () => ({
  batchWriteZones: jest.fn().mockResolvedValue(undefined),
  writeAlert: jest.fn().mockResolvedValue(undefined),
}));

import { CrowdDensityProcessor, type ZoneDensity } from '../processor';
import { batchWriteZones } from '../shared/firestore-client';

const mockedBatchWriteZones = jest.mocked(batchWriteZones);

const clearProcessorIntervals = (processor: CrowdDensityProcessor) => {
  clearInterval((processor as any).batchWriter.flushInterval);
  clearInterval((processor as any).smoothingCache.backupInterval);
  clearInterval((processor as any).activeAlertCache.syncInterval);
};

describe('BatchWriter', () => {
  let processor: CrowdDensityProcessor;

  beforeEach(() => {
    jest.useFakeTimers();
    mockedBatchWriteZones.mockClear();
    processor = new CrowdDensityProcessor();
    clearProcessorIntervals(processor);
  });

  afterEach(() => {
    clearProcessorIntervals(processor);
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should group queued zone writes by venue before flushing', async () => {
    const writer = (processor as any).batchWriter;

    const venueOneZoneA: ZoneDensity = {
      zoneId: 'zone-a',
      venueId: 'venue-1',
      occupancy: 0.61,
      capacity: 100,
      densityLevel: 'MEDIUM',
      rawCount: 61,
      lastUpdated: new Date().toISOString(),
      sensorConfidence: 0.91,
    };
    const venueOneZoneB: ZoneDensity = { ...venueOneZoneA, zoneId: 'zone-b', rawCount: 80, densityLevel: 'HIGH', occupancy: 0.8 };
    const venueTwoZone: ZoneDensity = { ...venueOneZoneA, venueId: 'venue-2', zoneId: 'zone-c', rawCount: 95, densityLevel: 'CRITICAL', occupancy: 0.95 };

    writer.queue('zone-a', venueOneZoneA);
    writer.queue('zone-b', venueOneZoneB);
    writer.queue('zone-c', venueTwoZone);

    await writer.flush();

    expect(mockedBatchWriteZones).toHaveBeenCalledTimes(2);
    expect(mockedBatchWriteZones).toHaveBeenCalledWith('venue-1', [venueOneZoneA, venueOneZoneB]);
    expect(mockedBatchWriteZones).toHaveBeenCalledWith('venue-2', [venueTwoZone]);
    expect((writer as any).pendingWrites.size).toBe(0);
  });
});
