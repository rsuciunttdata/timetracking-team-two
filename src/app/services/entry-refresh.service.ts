import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EntryRefreshService {
  private refreshTrigger = signal(0);

  get refreshSignal() {
    return this.refreshTrigger.asReadonly();
  }

  triggerRefresh() {
    this.refreshTrigger.update(count => count + 1);
  }
}
