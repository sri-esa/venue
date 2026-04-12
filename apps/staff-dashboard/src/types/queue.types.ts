export type StallType = 'FOOD' | 'DRINKS' | 'MERCHANDISE' | 'RESTROOM';

export interface QueueStatus {
  queueId: string;
  stallId: string;
  stallName: string;
  stallType: StallType;
  currentLength: number;
  estimatedWaitMinutes: number;
  isOpen: boolean;
  coordinates?: [number, number];
  lastUpdated: string;
  staleWarning?: boolean;
}

export type QueueTypeFilter = 'ALL' | StallType;
export type QueueStatusFilter = 'ALL' | 'OPEN ONLY' | 'CLOSED ONLY';
export type QueueWaitFilter = 'ALL' | '<5 MIN' | '5-15 MIN' | '>15 MIN';
export type QueueSortField = 'wait' | 'length' | 'name' | 'status';

export interface QueueFilter {
  type: QueueTypeFilter;
  status: QueueStatusFilter;
  wait: QueueWaitFilter;
}
