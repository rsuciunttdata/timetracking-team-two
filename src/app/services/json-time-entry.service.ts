import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, delay } from 'rxjs';
import { TimeEntry, TimeEntryCreateRequest, TimeEntryUpdateRequest } from '../models/time-entry.model';

@Injectable({
  providedIn: 'root'
})
export class JsonTimeEntryService {
  private jsonUrl = '/time-entries.json';
  private timeEntries: TimeEntry[] = [];
  private nextId = 1;
  private dataLoaded = false;

  constructor(private http: HttpClient) {}

  private loadDataFromJson(): Observable<TimeEntry[]> {
    if (this.dataLoaded) {
      return new Observable(observer => {
        observer.next([...this.timeEntries]);
        observer.complete();
      });
    }

    return this.http.get<{timeEntries: TimeEntry[]}>(this.jsonUrl).pipe(
      map(data => {
        this.timeEntries = [...data.timeEntries];
        this.nextId = Math.max(...this.timeEntries.map(entry => entry.id)) + 1;
        this.dataLoaded = true;
        return [...this.timeEntries];
      }),
      delay(500)
    );
  }

  getTimeEntries(): Observable<TimeEntry[]> {
    return this.loadDataFromJson();
  }

  getTimeEntry(id: number): Observable<TimeEntry> {
    return this.loadDataFromJson().pipe(
      map(entries => {
        const entry = entries.find(e => e.id === id);
        if (!entry) {
          throw new Error('Time entry not found');
        }
        return entry;
      })
    );
  }

  createTimeEntry(entry: TimeEntryCreateRequest): Observable<TimeEntry> {
    return this.loadDataFromJson().pipe(
      map(() => {
        const newEntry: TimeEntry = {
          id: this.nextId++,
          ...entry
        };
        this.timeEntries.push(newEntry);
        return newEntry;
      }),
      delay(300)
    );
  }

  updateTimeEntry(id: number, entry: TimeEntryUpdateRequest): Observable<TimeEntry> {
    return this.loadDataFromJson().pipe(
      map(() => {
        const index = this.timeEntries.findIndex(e => e.id === id);
        if (index === -1) {
          throw new Error('Time entry not found');
        }
        this.timeEntries[index] = { ...this.timeEntries[index], ...entry };
        return this.timeEntries[index];
      }),
      delay(300)
    );
  }

  deleteTimeEntry(id: number): Observable<void> {
    return this.loadDataFromJson().pipe(
      map(() => {
        const index = this.timeEntries.findIndex(e => e.id === id);
        if (index === -1) {
          throw new Error('Time entry not found');
        }
        this.timeEntries.splice(index, 1);
        return void 0;
      }),
      delay(300)
    );
  }
}
