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
  private readonly apiUrl = 'https://timetracking-ntt-backend.vercel.app/api/time-entries';
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
      throw new Error('Cannot access localStorage in server environment');
    }

    const uuid = localStorage.getItem('userUuid');
    if (!uuid) {
      throw new Error('User UUID not found. Please ensure user UUID is set.');
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
    return this.http.get<TimeEntry[]>(this.apiUrl, {
      headers: this.getHeaders(),
      params: this.getHttpParams()
    }).pipe(
      catchError(this.handleError)
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
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders(),
      params: this.getHttpParams()
    }).pipe(
      catchError(this.handleError)
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
