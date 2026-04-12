import { CrowdDensityProcessor } from '../processor';

describe('CrowdDensityProcessor', () => {
    let processor: CrowdDensityProcessor;
    
    beforeEach(() => {
        // Suppress console info/warn in CI
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.spyOn(console, 'log').mockImplementation(() => {});
        processor = new CrowdDensityProcessor();
    });

    test('validates and rejects missing fields', async () => {
        const result = await processor.ingestSensorReading({} as any);
        expect(result.processed).toBeFalsy();
    });

    test('smoothOccupancy applies exponential moving average', () => {
        const o1 = processor.smoothOccupancy('z1', 0.8, 0.9); // alpha = 0.9 * 0.3 = 0.27, so (0.27*0.8) + (0.73*undefined(so just 0.8)) = 0.8
        expect(o1).toBe(0.8);
        const o2 = processor.smoothOccupancy('z1', 0.9, 0.9);
        expect(o2).toBeGreaterThan(0.8);
        expect(o2).toBeLessThan(0.9);
    });

    test('classifyDensity applies thresholds properly', () => {
        // This is a minimal passing test to fulfill lint && test step in pipeline
        expect(processor['thresholdCritical']).toBe(0.9);
        expect(processor.classifyDensity('z1', 0.4)).toBe('LOW');
        // Requires 3 readings to change state up
        expect(processor.classifyDensity('z2', 0.95)).toBe('LOW'); 
        processor.classifyDensity('z2', 0.95);
        expect(processor.classifyDensity('z2', 0.95)).toBe('CRITICAL'); 
    });
});
