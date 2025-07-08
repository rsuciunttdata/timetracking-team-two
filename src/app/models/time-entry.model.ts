export interface TimeEntry {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  break: string;
  total: string;
  status: 'draft' | 'pending' | 'accepted' | 'rejected';
  project: string;
  description: string;
}

export interface TimeEntryCreateRequest {
  date: string;
  startTime: string;
  endTime: string;
  break: string;
  total: string;
  status: 'draft' | 'pending' | 'accepted' | 'rejected';
  project: string;
  description: string;
}

export interface TimeEntryUpdateRequest extends Partial<TimeEntryCreateRequest> {
  id: number;
}

export type TimeEntryStatus = 'draft' | 'pending' | 'accepted' | 'rejected';
