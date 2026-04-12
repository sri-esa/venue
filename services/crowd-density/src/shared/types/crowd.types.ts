// shared/types/crowd.types.ts

export type DensityLevel = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'UNKNOWN';

export interface ZoneDensity {
  zoneId: string;
  densityLevel: DensityLevel;
  currentOccupancy?: number;
  maxCapacity?: number;
}

export interface QueueStatus {
  stallId: string;
  stallName: string;
  stallType: 'FOOD' | 'MERCHANDISE' | 'RESTROOM' | 'ENTRY';
  isOpen: boolean;
  estimatedWaitMinutes: number;
  distanceMeters: number;
  coordinates: {
    lat: number;
    lng: number;
  };
}
