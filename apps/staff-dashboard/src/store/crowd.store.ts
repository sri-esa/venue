import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { ZoneDensity } from '../types/crowd.types';

interface CrowdState {
  zones: Record<string, ZoneDensity>;
  lastUpdated: Record<string, string>;
  isLoading: boolean;
  error: string | null;
}

interface CrowdActions {
  setZoneDensity: (zone: ZoneDensity) => void;
  setAllZones: (zones: ZoneDensity[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAll: () => void;
}

export const useCrowdStore = create<CrowdState & CrowdActions>()(
  subscribeWithSelector(
    immer((set) => ({
      zones: {},
      lastUpdated: {},
      isLoading: false,
      error: null,
      
      setZoneDensity: (zone) => set((state) => {
        state.zones[zone.zoneId] = zone;
        state.lastUpdated[zone.zoneId] = new Date().toISOString();
      }),
      setAllZones: (zones) => set((state) => {
        zones.forEach(z => {
          state.zones[z.zoneId] = z;
          state.lastUpdated[z.zoneId] = new Date().toISOString();
        });
      }),
      setLoading: (loading) => set((state) => { state.isLoading = loading; }),
      setError: (error) => set((state) => { state.error = error; }),
      clearAll: () => set((state) => {
        state.zones = {};
        state.lastUpdated = {};
      }),
    }))
  )
);

// Selectors — useShallow prevents new array refs causing infinite re-renders
export const useCriticalZones = () => useCrowdStore(useShallow(state => Object.values(state.zones).filter(z => z.densityLevel === 'CRITICAL')));
export const useHighRiskZones = () => useCrowdStore(useShallow(state => Object.values(state.zones).filter(z => z.densityLevel === 'CRITICAL' || z.densityLevel === 'HIGH')));
export const useZoneById = (id: string) => useCrowdStore(state => state.zones[id]);
export const useVenueOccupancy = () => useCrowdStore(state => {
  const allZones = Object.values(state.zones);
  if (!allZones.length) return 0;
  let current = 0;
  let total = 0;
  allZones.forEach(z => { current += z.rawCount; total += z.capacity; });
  return total > 0 ? current / total : 0;
});
