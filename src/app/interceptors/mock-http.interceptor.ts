import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpResponse, HttpEvent, HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, switchMap, catchError } from 'rxjs/operators';
import { TimeEntry, TimeEntryCreateRequest, TimeEntryUpdateRequest } from '../models/time-entry.model';

@Injectable()
export class MockHttpInterceptor implements HttpInterceptor {
  private timeEntries: TimeEntry[] = [];
  private nextId = 1;
  private dataLoaded = false;

  constructor(private http: HttpClient) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const { url, method, body } = req;

    if (!url.includes('/api/time-entries')) {
      return next.handle(req);
    }

    if (!this.dataLoaded) {
      return this.loadDataFromJson().pipe(
        switchMap(() => this.handleRequest(req)),
        delay(500)
      );
    }

    return this.handleRequest(req).pipe(delay(500));
  }

  private loadDataFromJson(): Observable<any> {
    return this.http.get<{timeEntries: TimeEntry[]}>('/assets/time-entries.json').pipe(
      switchMap(data => {
        this.timeEntries = [...data.timeEntries];
        this.nextId = Math.max(...this.timeEntries.map(entry => entry.id)) + 1;
        this.dataLoaded = true;
        return of(null);
      }),
      catchError(error => {
        console.error('Error loading mock data from JSON:', error);
        this.timeEntries = [];
        this.nextId = 1;
        this.dataLoaded = true;
        return of(null);
      })
    );
  }

  private handleRequest(req: HttpRequest<any>): Observable<HttpEvent<any>> {
    const { url, method, body } = req;

    if (method === 'GET' && url.endsWith('/api/time-entries')) {
      return of(new HttpResponse({
        status: 200,
        body: [...this.timeEntries]
      }));
    }

    if (method === 'GET' && url.match(/\/api\/time-entries\/\d+$/)) {
      const id = parseInt(url.split('/').pop() || '0');
      const entry = this.timeEntries.find(e => e.id === id);

      if (entry) {
        return of(new HttpResponse({
          status: 200,
          body: entry
        }));
      } else {
        return throwError(() => new HttpResponse({
          status: 404,
          body: { message: 'Time entry not found' }
        }));
      }
    }

    if (method === 'POST' && url.endsWith('/api/time-entries')) {
      const createRequest: TimeEntryCreateRequest = body;
      const newEntry: TimeEntry = {
        id: this.nextId++,
        ...createRequest
      };

      this.timeEntries.push(newEntry);

      return of(new HttpResponse({
        status: 201,
        body: newEntry
      }));
    }

    if (method === 'PUT' && url.match(/\/api\/time-entries\/\d+$/)) {
      const id = parseInt(url.split('/').pop() || '0');
      const updateRequest: TimeEntryUpdateRequest = body;
      const index = this.timeEntries.findIndex(e => e.id === id);

      if (index !== -1) {
        this.timeEntries[index] = { ...this.timeEntries[index], ...updateRequest };
        return of(new HttpResponse({
          status: 200,
          body: this.timeEntries[index]
        }));
      } else {
        return throwError(() => new HttpResponse({
          status: 404,
          body: { message: 'Time entry not found' }
        }));
      }
    }

    if (method === 'DELETE' && url.match(/\/api\/time-entries\/\d+$/)) {
      const id = parseInt(url.split('/').pop() || '0');
      const index = this.timeEntries.findIndex(e => e.id === id);

      if (index !== -1) {
        this.timeEntries.splice(index, 1);
        return of(new HttpResponse({
          status: 204,
          body: null
        }));
      } else {
        return throwError(() => new HttpResponse({
          status: 404,
          body: { message: 'Time entry not found' }
        }));
      }
    }

    return throwError(() => new HttpResponse({
      status: 404,
      body: { message: 'Endpoint not found' }
    }));
  }
}
