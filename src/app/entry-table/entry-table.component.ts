import { Component, ViewChild, OnInit, AfterViewInit, inject, effect, signal, computed, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { EntryFormDialogComponent } from '../entry-form-dialog/entry-form-dialog';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../confirmation-dialog/confirmation-dialog';
import { TimeEntryService } from '../services/time-entry.service';
import { EntryRefreshService } from '../services/entry-refresh.service';
import { getStatusText, TimeEntry } from '../models/time-entry.model';

@Component({
  selector: 'app-entry-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './entry-table.component.html',
  styleUrls: ['./entry-table.component.css']
})
export class EntryTableComponent implements OnInit, AfterViewInit {

  displayedColumns: string[] = ['date', 'startTime', 'endTime', 'break', 'total', 'status', 'actions'];
  dataSource = new MatTableDataSource<TimeEntry>();
  pageSize = 10;
  isDialogOpen = false;

  entriesSignal = signal<TimeEntry[]>([]);
  isLoadingSignal = signal<boolean>(false);
  errorSignal = signal<string | null>(null);

  filtersSignal = signal({
    dateFrom: '',
    dateTo: '',
    statuses: [] as number[]
  });

  currentPageSignal = signal<number>(0);
  pageSizeSignal = signal<number>(10);

  filteredEntriesSignal = computed(() => {
    const entries = this.entriesSignal();
    const filters = this.filtersSignal();

    let filtered = [...entries];

    if (filters.dateFrom) {
      const dateFrom = new Date(filters.dateFrom);
      filtered = filtered.filter(entry => new Date(entry.date) >= dateFrom);
    }

    if (filters.dateTo) {
      const dateTo = new Date(filters.dateTo);
      filtered = filtered.filter(entry => new Date(entry.date) <= dateTo);
    }

    if (filters.statuses.length > 0) {
      filtered = filtered.filter(entry => filters.statuses.includes(entry.status));
    }

    return filtered;
  });

  paginatedEntriesSignal = computed(() => {
    const filtered = this.filteredEntriesSignal();
    const currentPage = this.currentPageSignal();
    const pageSize = this.pageSizeSignal();

    const startIndex = currentPage * pageSize;
    const endIndex = startIndex + pageSize;

    return filtered.slice(startIndex, endIndex);
  });

  totalPagesSignal = computed(() => {
    const filtered = this.filteredEntriesSignal();
    const pageSize = this.pageSizeSignal();
    return Math.ceil(filtered.length / pageSize);
  });

  canGoNextSignal = computed(() => {
    const currentPage = this.currentPageSignal();
    const totalPages = this.totalPagesSignal();
    return currentPage < totalPages - 1;
  });

  canGoPreviousSignal = computed(() => {
    return this.currentPageSignal() > 0;
  });

  get filters() {
    return this.filtersSignal();
  }

  set filters(value: any) {
    this.filtersSignal.set(value);
  }

  get currentPage() {
    return this.currentPageSignal();
  }

  statusOptions = [
    { value: 1, label: 'Draft' },
    { value: 2, label: 'Pending' },
    { value: 3, label: 'Acceptat' },
    { value: 4, label: 'Respins' }
  ];

  @ViewChild(MatSort) sort!: MatSort;

  private static instanceCount = 0;
  private instanceId: number;
  private refreshService = inject(EntryRefreshService);
  private userUuid = '001';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private dialog: MatDialog,
    private timeEntryService: TimeEntryService,
    private snackBar: MatSnackBar
  ) {
    this.instanceId = ++EntryTableComponent.instanceCount;

    if (isPlatformBrowser(this.platformId)) {
      this.initializeUser();
    }

    effect(() => {
      this.refreshService.refreshSignal();
      if (isPlatformBrowser(this.platformId)) {
        this.loadTimeEntries();
      }
    });

    effect(() => {
      const paginatedEntries = this.paginatedEntriesSignal();
      this.dataSource.data = paginatedEntries;
    });

    effect(() => {
      this.filteredEntriesSignal();
      this.currentPageSignal.set(0);
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadTimeEntries();
    }
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  private initializeUser() {
    if (isPlatformBrowser(this.platformId) && typeof localStorage !== 'undefined') {
      localStorage.setItem('userUuid', this.userUuid);
      const storedUuid = localStorage.getItem('userUuid');
    }
  }

  loadTimeEntries() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    this.timeEntryService.getTimeEntries().subscribe({
      next: (entries) => {
        this.entriesSignal.set(entries);
        this.isLoadingSignal.set(false);
        this.showSnackBar(`Loaded ${entries.length} entries`, 'success');
      },
      error: (err) => {
        this.errorSignal.set('Error loading entries.');
        console.error('loadTimeEntries error:', err);
        this.showSnackBar('Error loading entries. Please check the backend.', 'error');
        this.isLoadingSignal.set(false);
      }
    });
  }

  onFilterChange() {
  }

  updateFilters(updates: Partial<typeof this.filters>) {
    const currentFilters = this.filtersSignal();
    this.filtersSignal.set({ ...currentFilters, ...updates });
  }

  clearFilters() {
    this.filtersSignal.set({
      dateFrom: '',
      dateTo: '',
      statuses: []
    });
    this.showSnackBar('Filters cleared', 'info');
  }

  toggleStatus(value: number): void {
    const currentFilters = this.filtersSignal();
    const currentStatuses = [...currentFilters.statuses];
    const index = currentStatuses.indexOf(value);

    if (index === -1) {
      currentStatuses.push(value);
    } else {
      currentStatuses.splice(index, 1);
    }

    this.updateFilters({ statuses: currentStatuses });
  }

  nextPage() {
    if (this.canGoNextSignal()) {
      this.currentPageSignal.update(page => page + 1);
    }
  }

  previousPage() {
    if (this.canGoPreviousSignal()) {
      this.currentPageSignal.update(page => page - 1);
    }
  }

  getFilteredEntries(): TimeEntry[] {
    return this.filteredEntriesSignal();
  }

  getStatusIcon(status: number): string {
    switch (status) {
      case 3: return 'check_circle';
      case 2: return 'schedule';
      case 1: return 'edit';
      case 4: return 'cancel';
      default: return 'help';
    }
  }

  getStatusText(status: number): string {
    return getStatusText(status);
  }

  getStatusClasses(status: number): string {
    switch (status) {
      case 3: return 'bg-green-100 text-green-800';
      case 2: return 'bg-blue-100 text-blue-800';
      case 1: return 'bg-yellow-100 text-yellow-800';
      case 4: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusIconColor(status: number): string {
    switch (status) {
      case 3: return 'bg-green-600';
      case 2: return 'bg-blue-600';
      case 1: return 'bg-yellow-600';
      case 4: return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  }

  canEditEntry(entry: TimeEntry): boolean {
    return entry.status === 1 || entry.status === 4;
  }

  canSendForApproval(entry: TimeEntry): boolean {
    return entry.status === 1;
  }

  addEntry() {
    if (this.isDialogOpen) return;

    this.isDialogOpen = true;

    const dialogRef = this.dialog.open(EntryFormDialogComponent, {
      width: '500px',
      disableClose: true,
      data: {
        allEntries: this.entriesSignal()
      }
    });

    dialogRef.afterClosed().subscribe(newEntry => {
      this.isDialogOpen = false;

      if (newEntry) {
        this.isLoadingSignal.set(true);
        this.timeEntryService.createTimeEntry(newEntry, this.userUuid).subscribe({
          next: (createdEntry) => {
            this.entriesSignal.update(entries => [...entries, createdEntry as TimeEntry]);
            this.showSnackBar('Entry added successfully!', 'success');
            this.isLoadingSignal.set(false);
          },
          error: (err) => {
            console.error('Add entry error:', err);
            this.errorSignal.set('Failed to add entry');
            this.showSnackBar('Failed to add entry', 'error');
            this.isLoadingSignal.set(false);
          }
        });
      }
    });
  }

  editEntry(entry: TimeEntry) {
    if (!this.canEditEntry(entry)) {
      this.showSnackBar('Cannot edit non-draft/rejected entry', 'error');
      return;
    }

    const dialogRef = this.dialog.open(EntryFormDialogComponent, {
      width: '500px',
      disableClose: true,
      data: {
        entry,
        isEditMode: true,
        allEntries: this.entriesSignal()
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const updatedEntry = {
          ...entry,
          ...result,
          status: entry.status === 4 ? 1 : entry.status
        };

        this.isLoadingSignal.set(true);

        this.timeEntryService.updateTimeEntry(entry.id, updatedEntry).subscribe({
          next: () => {
            this.entriesSignal.update(entries =>
              entries.map(e => e.id === entry.id ? updatedEntry : e)
            );
            this.showSnackBar('Entry updated successfully!', 'success');
            this.isLoadingSignal.set(false);
          },
          error: (err) => {
            console.error('Update error:', err);
            this.errorSignal.set('Failed to update entry');
            this.showSnackBar('Failed to update entry', 'error');
            this.isLoadingSignal.set(false);
          }
        });
      }
    });
  }

  deleteEntry(entry: TimeEntry) {
    if (!this.canEditEntry(entry)) {
      this.showSnackBar('Cannot delete non-editable entry', 'error');
      return;
    }

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: {
        title: 'Delete Entry',
        message: 'Are you sure?',
        confirmText: 'Delete Entry',
        cancelText: 'Cancel',
        icon: 'delete_forever',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.isLoadingSignal.set(true);

        this.timeEntryService.deleteTimeEntry(entry.id).subscribe({
          next: () => {
            this.entriesSignal.update(entries =>
              entries.filter(e => e.id !== entry.id)
            );
            this.showSnackBar('Entry deleted successfully!', 'success');
            this.isLoadingSignal.set(false);
          },
          error: (err) => {
            console.error('Delete error:', err);
            this.errorSignal.set('Failed to delete entry');
            this.showSnackBar('Failed to delete entry', 'error');
            this.isLoadingSignal.set(false);
          }
        });
      }
    });
  }

  sendForApproval(entry: TimeEntry) {
    if (!this.canSendForApproval(entry)) {
      this.showSnackBar('Only draft entries can be sent for approval', 'error');
      return;
    }

    const dialogData: ConfirmationDialogData = {
      title: 'Send for Approval',
      message: `Are you sure you want to send this time entry for approval?`,
      subMessage: `Once sent, you won't be able to edit or delete this entry until it's processed.`,
      confirmText: 'Send for Approval',
      cancelText: 'Keep as Draft',
      type: 'warning',
      icon: 'send'
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.isLoadingSignal.set(true);

        this.timeEntryService.sendForApproval(entry.id).subscribe({
          next: () => {
            this.refreshService.triggerRefresh();
            this.showSnackBar(`Entry sent for approval successfully!`, 'success');
          },
          error: (error) => {
            console.error('Error sending entry for approval:', error);
            this.showSnackBar('Error sending entry for approval. Please try again.', 'error');
            this.isLoadingSignal.set(false);
          }
        });
      }
    });
  }

  calculateTotal(entry: TimeEntry): string {
    const start = this.parseTime(entry.startTime);
    const end = this.parseTime(entry.endTime);
    const breakMinutes = parseInt(entry.break) || 0;

    if (!start || !end) return '';

    const totalMinutes = ((end.getTime() - start.getTime()) / 60000) - breakMinutes;

    if (totalMinutes < 0 || isNaN(totalMinutes)) return '';

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours}h ${minutes}m`;
  }

  private parseTime(timeStr: string): Date | null {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null;

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  refreshData() {
    this.refreshService.triggerRefresh();
  }

  formatBreakTime(minutesString: string): string {
    const totalMinutes = parseInt(minutesString || '0', 10);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    const hPart = hours > 0 ? `${hours}h` : '';
    const mPart = minutes > 0 ? `${minutes}m` : '';

    return `${hPart} ${mPart}`.trim() || '0m';
  }


  private showSnackBar(message: string, type: 'success' | 'error' | 'info' = 'info') {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: [`snackbar-${type}`]
    });
  }
}
