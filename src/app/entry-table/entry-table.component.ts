import { Component, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EntryFormDialogComponent } from '../entry-form-dialog/entry-form-dialog';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../confirmation-dialog/confirmation-dialog';
import { TimeEntryService } from '../services/time-entry.service';
import { TimeEntry } from '../models/time-entry.model';

@Component({
  selector: 'app-entry-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    ConfirmationDialogComponent
  ],
  templateUrl: './entry-table.component.html',
  styleUrls: ['./entry-table.component.css']
})
export class EntryTableComponent implements OnInit, AfterViewInit {

  displayedColumns: string[] = ['date', 'startTime', 'endTime', 'break', 'total', 'status', 'actions'];
  dataSource = new MatTableDataSource<TimeEntry>();
  loading = false;

  @ViewChild(MatSort) sort!: MatSort;

  private static instanceCount = 0;
  private instanceId: number;

  private isDialogOpen = false;

  constructor(
    private dialog: MatDialog,
    private timeEntryService: TimeEntryService,
    private snackBar: MatSnackBar
  ) {
    this.instanceId = ++EntryTableComponent.instanceCount;
    console.log(`EntryTableComponent constructed [instance ${this.instanceId}]`);
  }

  ngOnInit() {
    console.log('EntryTableComponent ngOnInit');
    this.loadTimeEntries();
  }

  ngAfterViewInit() {
    console.log('EntryTableComponent ngAfterViewInit');
    this.dataSource.sort = this.sort;
  }

  loadTimeEntries() {
    this.loading = true;

    this.timeEntryService.getTimeEntries().subscribe({
      next: (entries) => {
        this.dataSource.data = entries;
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

  addEntry() {
    if (this.isDialogOpen) {
      return;
    }

    this.isDialogOpen = true;

    const dialogRef = this.dialog.open(EntryFormDialogComponent, {
      width: '500px',
      disableClose: true,
      data: null
    });

    dialogRef.afterClosed().subscribe(result => {
      this.isDialogOpen = false;

      if (result) {
        this.loadTimeEntries();
      }
    });
  }

  editEntry(entry: TimeEntry) {
    const dialogRef = this.dialog.open(EntryFormDialogComponent, {
      width: '500px',
      disableClose: true,
      data: {
        entry: entry,
        isEditMode: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTimeEntries();
      }
    });
  }

  deleteEntry(entry: TimeEntry) {
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
            this.loadTimeEntries();
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

  refreshData() {
    this.loadTimeEntries();
  }

  private showSnackBar(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const config = {
      duration: 4000,
      horizontalPosition: 'right' as const,
      verticalPosition: 'top' as const,
      panelClass: [
        type === 'success' ? 'snackbar-success' :
          type === 'error' ? 'snackbar-error' : 'snackbar-info'
      ]
    };

    this.snackBar.open(message, 'Close', config);
  }
}
