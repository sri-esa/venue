const updateMock = jest.fn();
const getMock = jest.fn();

jest.mock('@google-cloud/pubsub', () => ({
  PubSub: jest.fn().mockImplementation(() => ({
    topic: jest.fn(() => ({ publishMessage: jest.fn().mockResolvedValue(undefined) })),
  })),
}));

jest.mock('../shared/firestore-client', () => ({
  db: {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    get: getMock,
    update: updateMock,
  },
  writeQueueStatus: jest.fn().mockResolvedValue(undefined),
  writeAlert: jest.fn().mockResolvedValue(undefined),
}));

import { QueueProcessor, type QueueCandidate } from '../queue_processor';

const buildCandidate = (overrides: Partial<QueueCandidate> = {}): QueueCandidate => ({
  queueId: 'queue-1',
  stallId: 'stall-1',
  stallName: 'North Snacks',
  stallType: 'FOOD',
  currentLength: 10,
  estimatedWaitMinutes: 8,
  isOpen: true,
  lastUpdated: new Date().toISOString(),
  distanceMeters: 30,
  ...overrides,
});

describe('QueueProcessor', () => {
  let processor: QueueProcessor;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-12T12:00:00.000Z'));
    updateMock.mockReset().mockResolvedValue(undefined);
    getMock.mockReset();
    processor = new QueueProcessor();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should estimate eight minutes for a food queue of ten customers', () => {
    const wait = processor.estimateWaitMinutes(10, 'FOOD', new Date('2026-04-12T12:00:00.000Z'), 'LOW');

    expect(wait).toBe(8);
  });

  it('should apply the CRITICAL density modifier when estimating wait minutes', () => {
    const wait = processor.estimateWaitMinutes(10, 'FOOD', new Date('2026-04-12T12:00:00.000Z'), 'CRITICAL');

    expect(wait).toBe(12);
  });

  it('should apply the half-time surge modifier during the 45 to 59 minute window', () => {
    const wait = processor.estimateWaitMinutes(10, 'FOOD', new Date('2026-04-12T12:50:00'), 'LOW');

    expect(wait).toBe(13);
  });

  it('should choose the queue with the best 60 wait and 40 distance weighted score', () => {
    const best = processor.nearestQueue([
      buildCandidate({ queueId: 'queue-a', estimatedWaitMinutes: 8, distanceMeters: 30 }),
      buildCandidate({ queueId: 'queue-b', estimatedWaitMinutes: 5, distanceMeters: 100 }),
      buildCandidate({ queueId: 'queue-c', estimatedWaitMinutes: 10, distanceMeters: 120 }),
    ]);

    expect(best?.queueId).toBe('queue-a');
  });

  it('should flag stale queue data after five minutes without updates', async () => {
    getMock.mockResolvedValue({
      empty: false,
      docs: [
        {
          id: 'queue-1',
          data: () => ({
            lastUpdated: new Date(Date.now() - 6 * 60_000).toISOString(),
          }),
        },
      ],
    });

    await processor.markStaleData('venue-1');

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        isOpen: false,
        staleWarning: true,
      }),
    );
  });

  it('should expire manual overrides after ten minutes', () => {
    const createdAt = new Date('2026-04-12T12:00:00.000Z').getTime();

    processor.setManualOverride('queue-1', 4, createdAt);

    expect(processor.getManualOverride('queue-1', createdAt + 9 * 60_000)).toEqual({
      waitMinutes: 4,
      expiresAt: createdAt + 10 * 60_000,
    });
    expect(processor.getManualOverride('queue-1', createdAt + 10 * 60_000 + 1)).toBeNull();
  });
});
