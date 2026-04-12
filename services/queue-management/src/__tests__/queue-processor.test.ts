import { QueueProcessor } from '../queue_processor';

describe('QueueProcessor', () => {
    let processor: QueueProcessor;
    
    beforeEach(() => {
        processor = new QueueProcessor();
    });

    test('estimateWaitMinutes applies base rates properly', () => {
        // FOOD = 45s base. q=10 -> 450s -> 7.5m -> ceil(7.5) = 8
        const wait = processor.estimateWaitMinutes(10, 'FOOD', new Date('2026-04-08T12:00:00Z'), 'LOW');
        expect(wait).toBe(8);
    });

    test('estimateWaitMinutes applies CRITICAL surge modifier', () => {
        // DRINKS = 30s base. q=10 -> 300s. CRITICAL -> 300 * 1.4 = 420s -> 7m
        const wait = processor.estimateWaitMinutes(10, 'DRINKS', new Date('2026-04-08T12:00:00Z'), 'CRITICAL');
        expect(wait).toBe(7);
    });
});
