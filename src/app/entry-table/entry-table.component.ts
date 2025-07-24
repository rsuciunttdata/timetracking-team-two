import { Component, ViewChild, OnInit, AfterViewInit, inject, effect, PLATFORM_ID, Inject } from '@angular/core';
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
import { TimeEntry } from '../models/time-entry.model';

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
  allEntries: TimeEntry[] = [];
  loading = false;
  isStatusDropdownOpen = false;
  currentPage = 0;
  pageSize = 10;
  pagedEntries: TimeEntry[] = [];

  filters = {
    dateFrom: '',
    dateTo: '',
    statuses: [] as string[]
  };

  statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'pending', label: 'Pending' },
    { value: 'accepted', label: 'Acceptat' },
    { value: 'rejected', label: 'Respins' }
  ];

  @ViewChild(MatSort) sort!: MatSort;

  private static instanceCount = 0;
  private instanceId: number;
  private isDialogOpen = false;

  private refreshService = inject(EntryRefreshService);

  private userUuid = '001';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private dialog: MatDialog,
    private timeEntryService: TimeEntryService,
    private snackBar: MatSnackBar
  ) {
    this.instanceId = ++EntryTableComponent.instanceCount;
    console.log(`EntryTableComponent constructed [instance ${this.instanceId}]`);

    if (isPlatformBrowser(this.platformId)) {
      this.initializeUser();
    }

    effect(() => {
      this.refreshService.refreshSignal();
      console.log(`[instance ${this.instanceId}] refreshSignal triggered`);
      if (isPlatformBrowser(this.platformId)) {
        this.loadTimeEntries();
      }
    });
  }

  ngOnInit() {
    console.log('EntryTableComponent ngOnInit');
    if (isPlatformBrowser(this.platformId)) {
      this.loadTimeEntries();
    }
  }

  ngAfterViewInit() {
    console.log('EntryTableComponent ngAfterViewInit');
    this.dataSource.sort = this.sort;
  }

  private initializeUser() {
    if (isPlatformBrowser(this.platformId) && typeof localStorage !== 'undefined') {
      localStorage.setItem('userUuid', this.userUuid);

      const storedUuid = localStorage.getItem('userUuid');
    }
  }

  loadTimeEntries() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.loading = true;

    this.timeEntryService.getTimeEntries().subscribe({
      next: (entries) => {
        this.allEntries = entries;
        this.applyFilters();
        this.loading = false;
        this.showSnackBar(`Loaded ${entries.length} entries`, 'success');
      },
      error: (error) => {
        console.error('Error loading time entries:', error);
        this.showSnackBar('Error loading time entries. Please check if backend is running.', 'error');
        this.loading = false;
      }
    });
  }

  applyFilters() {
    let filteredEntries = [...this.allEntries];

    if (this.filters.dateFrom) {
      const dateFrom = new Date(this.filters.dateFrom);
      filteredEntries = filteredEntries.filter(entry =>
        new Date(entry.date) >= dateFrom
      );
    }

    if (this.filters.dateTo) {
      const dateTo = new Date(this.filters.dateTo);
      filteredEntries = filteredEntries.filter(entry =>
        new Date(entry.date) <= dateTo
      );
    }

    if (this.filters.statuses.length > 0) {
      filteredEntries = filteredEntries.filter(entry =>
        this.filters.statuses.includes(entry.status)
      );
    }

    this.currentPage = 0;
    this.setPagedEntries(filteredEntries);
  }

  setPagedEntries(entries: TimeEntry[]) {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.pagedEntries = entries.slice(startIndex, endIndex);
    this.dataSource.data = this.pagedEntries;
  }

  nextPage() {
    const totalPages = Math.ceil(this.allEntries.length / this.pageSize);
    if (this.currentPage < totalPages - 1) {
      this.currentPage++;
      this.setPagedEntries(this.getFilteredEntries());
    }
  }

  previousPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.setPagedEntries(this.getFilteredEntries());
    }
  }

  getFilteredEntries(): TimeEntry[] {
    let filtered = [...this.allEntries];

    if (this.filters.dateFrom) {
      const dateFrom = new Date(this.filters.dateFrom);
      filtered = filtered.filter(entry => new Date(entry.date) >= dateFrom);
    }

    if (this.filters.dateTo) {
      const dateTo = new Date(this.filters.dateTo);
      filtered = filtered.filter(entry => new Date(entry.date) <= dateTo);
    }

    if (this.filters.statuses.length > 0) {
      filtered = filtered.filter(entry => this.filters.statuses.includes(entry.status));
    }

    return filtered;
  }

  clearFilters() {
    this.filters = {
      dateFrom: '',
      dateTo: '',
      statuses: []
    };
    this.applyFilters();
    this.showSnackBar('Filters cleared', 'info');
  }

  onFilterChange() {
    this.applyFilters();
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'accepted': return 'check_circle';
      case 'pending': return 'schedule';
      case 'draft': return 'edit';
      case 'rejected': return 'cancel';
      default: return 'help';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'accepted': return 'Acceptat';
      case 'pending': return 'Pending';
      case 'draft': return 'Draft';
      case 'rejected': return 'Respins';
      default: return 'Necunoscut';
    }
  }

  getStatusClasses(status: string): string {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusIconColor(status: string): string {
    switch (status) {
      case 'accepted': return 'text-green-600';
      case 'pending': return 'text-blue-600';
      case 'draft': return 'text-yellow-600';
      case 'rejected': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }

  canEditEntry(entry: TimeEntry): boolean {
    return entry.status === 'draft' || entry.status === 'rejected';
  }

  canSendForApproval(entry: TimeEntry): boolean {
    return entry.status === 'draft';
  }

  addEntry() {
    if (this.isDialogOpen) {
      return;
    }

    this.isDialogOpen = true;

    const dialogRef = this.dialog.open(EntryFormDialogComponent, {
      width: '500px',
      disableClose: true,
      data: {}
    });

    dialogRef.afterClosed().subscribe(() => {
      this.isDialogOpen = false;
    });
  }

  editEntry(entry: TimeEntry) {
    if (!this.canEditEntry(entry)) {
      this.showSnackBar('Cannot edit entry that is pending approval or already approved', 'error');
      return;
    }

    const dialogRef = this.dialog.open(EntryFormDialogComponent, {
      width: '500px',
      disableClose: true,
      data: {
        entry: entry,
        isEditMode: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && entry.status === 'rejected') {
        const updatedEntry = { ...result, status: 'draft' };
        this.timeEntryService.updateTimeEntry(entry.id, updatedEntry).subscribe({
          next: () => {
            this.refreshService.triggerRefresh();
            this.showSnackBar('Entry updated and moved back to draft status', 'success');
          },
          error: (error) => {
            console.error('Error updating entry status:', error);
            this.refreshService.triggerRefresh();
          }
        });
      }
    });
  }

  deleteEntry(entry: TimeEntry) {
    if (!this.canEditEntry(entry)) {
      this.showSnackBar('Cannot delete entry that is pending approval or already approved', 'error');
      return;
    }

    const dialogData: ConfirmationDialogData = {
      title: 'Delete Time Entry',
      message: `Are you sure you want to delete this time entry?`,
      subMessage: `Date: ${entry.date}, Project: ${entry.project || 'N/A'}`,
      confirmText: 'Delete Entry',
      cancelText: 'Keep Entry',
      type: 'danger',
      icon: 'delete_forever'
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.loading = true;

        this.timeEntryService.deleteTimeEntry(entry.id).subscribe({
          next: () => {
            this.refreshService.triggerRefresh();
            this.showSnackBar(`Entry deleted successfully!`, 'success');
          },
          error: (error) => {
            console.error('Error deleting time entry:', error);
            this.showSnackBar('Error deleting time entry. Please try again.', 'error');
            this.loading = false;
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
        this.loading = true;

        this.timeEntryService.sendForApproval(entry.id).subscribe({
          next: () => {
            this.refreshService.triggerRefresh();
            this.showSnackBar(`Entry sent for approval successfully!`, 'success');
          },
          error: (error) => {
            console.error('Error sending entry for approval:', error);
            this.showSnackBar('Error sending entry for approval. Please try again.', 'error');
            this.loading = false;
          }
        });
      }
    });
  }

  refreshData() {
    this.refreshService.triggerRefresh();
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
