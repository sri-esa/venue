export type DensityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ZoneDensity {
  zoneId: string;
  venueId: string;
  occupancy: number; // 0.0 to >1.0
  capacity: number;
  densityLevel: DensityLevel;
  rawCount: number;
  lastUpdated: string;
  sensorConfidence: number;
}
