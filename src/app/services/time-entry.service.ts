import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TimeEntry, TimeEntryCreateRequest, TimeEntryUpdateRequest } from '../models/time-entry.model';

@Injectable({
  providedIn: 'root'
})
export class TimeEntryService {
  private readonly apiUrl = '/api/time-entries';

  constructor(private http: HttpClient) { }

  getTimeEntries(): Observable<TimeEntry[]> {
    return this.http.get<TimeEntry[]>(this.apiUrl);
  }

  getTimeEntry(id: number): Observable<TimeEntry> {
    return this.http.get<TimeEntry>(`${this.apiUrl}/${id}`);
  }

  createTimeEntry(entry: TimeEntryCreateRequest): Observable<TimeEntry> {
    return this.http.post<TimeEntry>(this.apiUrl, entry);
  }

  updateTimeEntry(id: number, entry: TimeEntryUpdateRequest): Observable<TimeEntry> {
    return this.http.put<TimeEntry>(`${this.apiUrl}/${id}`, entry);
  }

  sendForApproval(id: number): Observable<TimeEntry> {
    return this.http.patch<TimeEntry>(`${this.apiUrl}/${id}/send-for-approval`, {});
  }

  deleteTimeEntry(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
