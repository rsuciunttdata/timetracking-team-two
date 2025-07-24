import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { TimeEntry, TimeEntryCreateRequest, TimeEntryUpdateRequest } from '../models/time-entry.model';

@Injectable({
  providedIn: 'root'
})
export class TimeEntryService {
  // private readonly apiUrl = 'https://timetracking-ntt-backend.vercel.app/api/time-entries';
  private readonly apiUrl = 'http://localhost:3001/api/time-entries';
  private currentUuid: string = '';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  setUserUuid(uuid: string): void {
    this.currentUuid = uuid;
  }

  private getUserUuid(): string {

    if (this.currentUuid) {
      return this.currentUuid;
    }

    if (!isPlatformBrowser(this.platformId) || typeof localStorage === 'undefined') {
      console.error('❌ [Service] Cannot access localStorage in server environment');
      throw new Error('Cannot access localStorage in server environment');
    }

    const uuid = localStorage.getItem('uuid');

    if (!uuid) {
      console.error('❌ [Service] No UUID found in localStorage');
      throw new Error('User UUID not found. Please ensure user is logged in.');
    }
    return uuid;
  }

  private getHttpParams(): HttpParams {
    return new HttpParams().set('uuid', this.getUserUuid());
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  getTimeEntries(): Observable<TimeEntry[]> {
    const uuid = this.getUserUuid();
    const url = `${this.apiUrl}?uuid=${uuid}`;

    return this.http.get<TimeEntry[]>(this.apiUrl, {
      headers: this.getHeaders(),
      params: this.getHttpParams()
    }).pipe(
      tap(entries => {
      }),
      catchError(error => {
        console.error('❌ [Service] API Error:', error);
        return this.handleError(error);
      })
    );
  }

  getTimeEntry(id: number): Observable<TimeEntry> {
    return this.http.get<TimeEntry>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders(),
      params: this.getHttpParams()
    }).pipe(
      catchError(this.handleError)
    );
  }

  createTimeEntry(entry: Omit<TimeEntry, 'id'>): Observable<TimeEntry> {
    return this.http.post<TimeEntry>(this.apiUrl, entry, {
      headers: this.getHeaders(),
      params: this.getHttpParams()
    }).pipe(
      catchError(this.handleError)
    );
  }

  updateTimeEntry(id: number, entry: Partial<TimeEntry>): Observable<TimeEntry> {
    return this.http.put<TimeEntry>(`${this.apiUrl}/${id}`, entry, {
      headers: this.getHeaders(),
      params: this.getHttpParams()
    }).pipe(
      catchError(this.handleError)
    );
  }

  deleteTimeEntry(id: number): Observable<void> {
    const uuid = this.getUserUuid();

    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders(),
      params: this.getHttpParams()
    }).pipe(
      tap(() => {
      }),
      catchError(error => {
        console.error(`❌ [Service] Failed to delete entry ${id}:`, error);
        return this.handleError(error);
      })
    );
  }

  sendForApproval(id: number): Observable<TimeEntry> {
    return this.http.patch<TimeEntry>(`${this.apiUrl}/${id}/send-for-approval`, {}, {
      headers: this.getHeaders(),
      params: this.getHttpParams()
    }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('API Error:', error);

    if (error.status === 400 && error.error?.error === 'missing uuid') {
      return throwError(() => new Error('User UUID is missing. Please ensure you are logged in.'));
    }

    if (error.status === 0) {
      return throwError(() => new Error('Network error. Please check your internet connection.'));
    }

    return throwError(() => error);
  }
}
