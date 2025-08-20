export interface TimeEntry {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  break: string;
  status: number;
  project: string;
  description: string;
  rejectionMessage?: string;
}

export interface TimeEntryCreateRequest {
  date: string;
  startTime: string;
  endTime: string;
  break: string;
  total: string;
  status: number;
  project: string;
  description: string;
}

export interface TimeEntryUpdateRequest extends Partial<TimeEntryCreateRequest> {
  id: number;
}

export type TimeEntryStatus = 1 | 2 | 3 | 4;

export const STATUS_MAP = {
  1: 'draft',
  2: 'pending',
  3: 'acceptat',
  4: 'respins'
} as const;

export const REVERSE_STATUS_MAP = {
  'draft': 1,
  'pending': 2,
  'acceptat': 3,
  'respins': 4
} as const;

export function getStatusText(statusNumber: number): string {
  return STATUS_MAP[statusNumber as keyof typeof STATUS_MAP] || 'necunoscut';
}

export function getStatusNumber(statusText: string): number {
  return REVERSE_STATUS_MAP[statusText as keyof typeof REVERSE_STATUS_MAP] || 1;
}
