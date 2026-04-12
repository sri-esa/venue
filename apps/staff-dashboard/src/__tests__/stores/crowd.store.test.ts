import '../../setupTests';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, renderHook } from '@testing-library/react';
import { useCriticalZones, useCrowdStore, useVenueOccupancy } from '../../store/crowd.store';
import type { ZoneDensity } from '../../types/crowd.types';

const makeZone = (overrides: Partial<ZoneDensity> = {}): ZoneDensity => ({
  zoneId: 'zone-1',
  venueId: 'venue-1',
  occupancy: 0.5,
  capacity: 100,
  densityLevel: 'MEDIUM',
  rawCount: 50,
  lastUpdated: '2026-04-12T12:00:00.000Z',
  sensorConfidence: 0.92,
  ...overrides,
});

describe('crowd.store', () => {
  beforeEach(() => {
    useCrowdStore.setState({
      zones: {},
      lastUpdated: {},
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    cleanup();
    useCrowdStore.getState().clearAll();
  });

  it('should update a single zone immutably when setZoneDensity is called', () => {
    useCrowdStore.getState().setZoneDensity(makeZone({ zoneId: 'zone-1', occupancy: 0.4, rawCount: 40 }));

    const previousZones = useCrowdStore.getState().zones;
    const previousZone = useCrowdStore.getState().zones['zone-1'];

    useCrowdStore.getState().setZoneDensity(makeZone({ zoneId: 'zone-1', occupancy: 0.9, densityLevel: 'CRITICAL', rawCount: 90 }));

    const currentState = useCrowdStore.getState();
    expect(currentState.zones).not.toBe(previousZones);
    expect(currentState.zones['zone-1']).not.toBe(previousZone);
    expect(currentState.zones['zone-1']).toEqual(expect.objectContaining({ occupancy: 0.9, densityLevel: 'CRITICAL', rawCount: 90 }));
    expect(previousZone.occupancy).toBe(0.4);
  });

  it('should return only critical zones from useCriticalZones', () => {
    useCrowdStore.getState().setAllZones([
      makeZone({ zoneId: 'zone-1', densityLevel: 'LOW' }),
      makeZone({ zoneId: 'zone-2', densityLevel: 'CRITICAL' }),
      makeZone({ zoneId: 'zone-3', densityLevel: 'HIGH' }),
      makeZone({ zoneId: 'zone-4', densityLevel: 'CRITICAL' }),
    ]);

    const { result } = renderHook(() => useCriticalZones());

    expect(result.current.map((zone) => zone.zoneId)).toEqual(['zone-2', 'zone-4']);
  });

  it('should calculate the weighted venue occupancy from raw counts and capacities', () => {
    useCrowdStore.getState().setAllZones([
      makeZone({ zoneId: 'zone-1', rawCount: 50, capacity: 100 }),
      makeZone({ zoneId: 'zone-2', rawCount: 90, capacity: 100 }),
    ]);

    const { result } = renderHook(() => useVenueOccupancy());

    expect(result.current).toBeCloseTo(0.7, 5);
  });

  it('should reset the store to an empty state when clearAll is called', () => {
    useCrowdStore.getState().setAllZones([makeZone()]);

    useCrowdStore.getState().clearAll();

    expect(useCrowdStore.getState().zones).toEqual({});
    expect(useCrowdStore.getState().lastUpdated).toEqual({});
  });
});
