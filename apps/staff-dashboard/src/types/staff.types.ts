export type StaffRole = 'GUARD' | 'EMT' | 'MANAGER' | 'VENDOR';

export interface StaffMember {
  staffId: string;
  name: string;
  role: StaffRole;
  active: boolean;
  assignedZone?: string;
  location?: { lat: number; lng: number };
  lastUpdated: string;
}

export interface StaffAssignment {
  assignmentId: string;
  staffId: string;
  zoneId: string;
  task: string;
  assignedAt: string;
}
