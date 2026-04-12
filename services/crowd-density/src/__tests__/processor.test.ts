const mockPublishMessage = jest.fn().mockResolvedValue('message-id');
const mockTopic = jest.fn((name: string) => ({ name, publishMessage: mockPublishMessage }));

jest.mock('@google-cloud/pubsub', () => ({
  PubSub: jest.fn().mockImplementation(() => ({
    topic: mockTopic,
  })),
}));

jest.mock('../shared/firestore-client', () => ({
  batchWriteZones: jest.fn().mockResolvedValue(undefined),
  writeAlert: jest.fn().mockResolvedValue(undefined),
}));

import { CrowdDensityProcessor, type RawSensorReading, type ZoneDensity } from '../processor';
import { batchWriteZones, writeAlert } from '../shared/firestore-client';

const mockedBatchWriteZones = jest.mocked(batchWriteZones);
const mockedWriteAlert = jest.mocked(writeAlert);

const buildReading = (overrides: Partial<RawSensorReading> = {}): RawSensorReading => ({
  sensorId: 'sensor-1',
  zoneId: 'zone-01',
  venueId: 'venue-1',
  timestamp: new Date().toISOString(),
  rawCount: 90,
  capacity: 100,
  occupancy: 0.9,
  confidence: 0.9,
  sensorType: 'CAMERA',
  ...overrides,
});

const clearProcessorIntervals = (processor: CrowdDensityProcessor) => {
  clearInterval((processor as any).batchWriter.flushInterval);
  clearInterval((processor as any).smoothingCache.backupInterval);
  clearInterval((processor as any).activeAlertCache.syncInterval);
};

describe('CrowdDensityProcessor', () => {
  let processor: CrowdDensityProcessor;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-12T10:00:00.000Z'));
    mockedBatchWriteZones.mockClear();
    mockedWriteAlert.mockClear();
    mockPublishMessage.mockClear();
    mockTopic.mockClear();
    processor = new CrowdDensityProcessor();
    clearProcessorIntervals(processor);
  });

  afterEach(() => {
    clearProcessorIntervals(processor);
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should apply the expected exponential moving average in smoothOccupancy', () => {
    (processor as any).smoothingCache.set('zone-ema', 0.7);

    const smoothed = processor.smoothOccupancy('zone-ema', 0.9, 0.8);

    expect(smoothed).toBeCloseTo(0.748, 3);
    expect((processor as any).smoothingCache.get('zone-ema')).toBeCloseTo(0.748, 3);
  });

  it('should classify all density thresholds after the configured sustained readings', () => {
    expect(processor.classifyDensity('zone-low', 0.4)).toBe('LOW');

    processor.classifyDensity('zone-medium', 0.6);
    processor.classifyDensity('zone-medium', 0.6);
    expect(processor.classifyDensity('zone-medium', 0.6)).toBe('MEDIUM');

    processor.classifyDensity('zone-high', 0.8);
    processor.classifyDensity('zone-high', 0.8);
    expect(processor.classifyDensity('zone-high', 0.8)).toBe('HIGH');

    processor.classifyDensity('zone-critical', 0.95);
    processor.classifyDensity('zone-critical', 0.95);
    expect(processor.classifyDensity('zone-critical', 0.95)).toBe('CRITICAL');
  });

  it('should reject low confidence readings', async () => {
    const result = await processor.ingestSensorReading(buildReading({ confidence: 0.69 }));

    expect(result).toEqual({ processed: false, zoneId: 'zone-01' });
  });

  it('should reject stale readings older than 30 seconds', async () => {
    const staleTimestamp = new Date(Date.now() - 31_000).toISOString();

    const result = await processor.ingestSensorReading(buildReading({ timestamp: staleTimestamp }));

    expect(result).toEqual({ processed: false, zoneId: 'zone-01' });
  });

  it('should not create a crowd alert for seating zones', async () => {
    const criticalZone: ZoneDensity = {
      zoneId: 'zone-07',
      venueId: 'venue-1',
      occupancy: 0.96,
      capacity: 100,
      densityLevel: 'CRITICAL',
      rawCount: 96,
      lastUpdated: new Date().toISOString(),
      sensorConfidence: 0.9,
    };

    await processor.evaluateAlerts(criticalZone, 'LOW');

    expect(mockedWriteAlert).not.toHaveBeenCalled();
    expect(mockPublishMessage).not.toHaveBeenCalled();
  });

  it('should fire an alert when a non-seating zone transitions to CRITICAL', async () => {
    const criticalZone: ZoneDensity = {
      zoneId: 'zone-01',
      venueId: 'venue-1',
      occupancy: 0.96,
      capacity: 100,
      densityLevel: 'CRITICAL',
      rawCount: 96,
      lastUpdated: new Date().toISOString(),
      sensorConfidence: 0.92,
    };

    await processor.evaluateAlerts(criticalZone, 'HIGH');

    expect(mockedWriteAlert).toHaveBeenCalledTimes(1);
    expect(mockedWriteAlert.mock.calls[0][0]).toBe('venue-1');
    expect(mockedWriteAlert.mock.calls[0][2]).toEqual(
      expect.objectContaining({
        venueId: 'venue-1',
        zoneId: 'zone-01',
        severity: 'CRITICAL',
        type: 'CROWD_DENSITY',
      }),
    );
    expect(mockTopic).toHaveBeenNthCalledWith(1, 'venue-alerts');
    expect(mockTopic).toHaveBeenNthCalledWith(2, 'fcm-notifications');
    expect(mockPublishMessage).toHaveBeenCalledTimes(2);
  });

  it('should reject duplicate readings from the same sensor within three seconds', async () => {
    const first = await processor.ingestSensorReading(buildReading());

    jest.setSystemTime(new Date('2026-04-12T10:00:02.000Z'));
    const second = await processor.ingestSensorReading(
      buildReading({
        timestamp: new Date().toISOString(),
      }),
    );

    expect(first.processed).toBe(true);
    expect(second).toEqual({ processed: false, zoneId: 'zone-01' });
  });
});
