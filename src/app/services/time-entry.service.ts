import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { TimeEntry, TimeEntryCreateRequest, TimeEntryUpdateRequest } from '../models/time-entry.model';

@Injectable({
  providedIn: 'root'
})
export class TimeEntryService {
  private readonly apiUrl = 'https://timetracking-ntt-backend.vercel.app/api/time-entries';

  constructor(private http: HttpClient) {
    console.log('[TimeEntryService] Initialized with API URL:', this.apiUrl);
  }

  getTimeEntries(): Observable<TimeEntry[]> {
    console.log('[TimeEntryService] Fetching time entries from:', this.apiUrl);

    return this.http.get<TimeEntry[]>(this.apiUrl).pipe(
      tap(response => {
        console.log('[TimeEntryService] Received response:', response);
        console.log('[TimeEntryService] Response type:', typeof response);
        console.log('[TimeEntryService] Is array:', Array.isArray(response));
        console.log('[TimeEntryService] Length:', response?.length);
      }),
      catchError(error => {
        console.error('[TimeEntryService] Error fetching time entries:', error);
        console.error('[TimeEntryService] Error status:', error.status);
        console.error('[TimeEntryService] Error message:', error.message);
        return throwError(() => error);
      })
    );
  }

  getTimeEntry(id: number): Observable<TimeEntry> {
    const url = `${this.apiUrl}/${id}`;
    console.log('[TimeEntryService] Fetching single entry from:', url);
    return this.http.get<TimeEntry>(url);
  }

  createTimeEntry(entry: TimeEntryCreateRequest): Observable<TimeEntry> {
    console.log('[TimeEntryService] Creating entry at:', this.apiUrl, 'with data:', entry);
    return this.http.post<TimeEntry>(this.apiUrl, entry);
  }

  updateTimeEntry(id: number, entry: TimeEntryUpdateRequest): Observable<TimeEntry> {
    const url = `${this.apiUrl}/${id}`;
    console.log('[TimeEntryService] Updating entry at:', url, 'with data:', entry);
    return this.http.put<TimeEntry>(url, entry);
  }

  sendForApproval(id: number): Observable<TimeEntry> {
    const url = `${this.apiUrl}/${id}/send-for-approval`;
    console.log('[TimeEntryService] Sending for approval at:', url);
    return this.http.patch<TimeEntry>(url, {});
  }

  deleteTimeEntry(id: number): Observable<void> {
    const url = `${this.apiUrl}/${id}`;
    console.log('[TimeEntryService] Deleting entry at:', url);
    return this.http.delete<void>(url);
  }
}
