import { Component, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EntryFormDialogComponent } from '../entry-form-dialog/entry-form-dialog';
import { JsonTimeEntryService } from '../services/json-time-entry.service';
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
    MatSnackBarModule
  ],
  templateUrl: './entry-table.component.html',
  styleUrls: ['./entry-table.component.css']
})
export class EntryTableComponent implements OnInit, AfterViewInit {

  displayedColumns: string[] = ['date', 'startTime', 'endTime', 'break', 'total', 'status', 'actions'];
  dataSource = new MatTableDataSource<TimeEntry>();
  loading = false;

  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private dialog: MatDialog,
    private timeEntryService: JsonTimeEntryService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadTimeEntries();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  loadTimeEntries() {
    this.loading = true;
    this.timeEntryService.getTimeEntries().subscribe({
      next: (entries) => {
        this.dataSource.data = entries;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading time entries:', error);
        this.showSnackBar('Error loading time entries');
        this.loading = false;
      }
    });
  }

  getStatusIcon(status: string): string {
    switch(status) {
      case 'accepted': return 'check_circle';
      case 'pending': return 'schedule';
      case 'draft': return 'edit';
      case 'rejected': return 'cancel';
      default: return 'help';
    }
  }

  getStatusText(status: string): string {
    switch(status) {
      case 'accepted': return 'Acceptat';
      case 'pending': return 'Pending';
      case 'draft': return 'Draft';
      case 'rejected': return 'Respins';
      default: return 'Necunoscut';
    }
  }

  getStatusClasses(status: string): string {
    switch(status) {
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusIconColor(status: string): string {
    switch(status) {
      case 'accepted': return 'text-green-600';
      case 'pending': return 'text-blue-600';
      case 'draft': return 'text-yellow-600';
      case 'rejected': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }

  addEntry() {
    const dialogRef = this.dialog.open(EntryFormDialogComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.timeEntryService.createTimeEntry(result).subscribe({
          next: (newEntry) => {
            this.loadTimeEntries();
            this.showSnackBar('Time entry created successfully');
          },
          error: (error) => {
            console.error('Error creating time entry:', error);
            this.showSnackBar('Error creating time entry');
          }
        });
      }
    });
  }

  editEntry(entry: TimeEntry) {
    const dialogRef = this.dialog.open(EntryFormDialogComponent, {
      width: '400px',
      data: { entry, isEditMode: true }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.timeEntryService.updateTimeEntry(entry.id, result).subscribe({
          next: (updatedEntry) => {
            this.loadTimeEntries();
            this.showSnackBar('Time entry updated successfully');
          },
          error: (error) => {
            console.error('Error updating time entry:', error);
            this.showSnackBar('Error updating time entry');
          }
        });
      }
    });
  }

  deleteEntry(entry: TimeEntry) {
    if (confirm('Are you sure you want to delete this time entry?')) {
      this.timeEntryService.deleteTimeEntry(entry.id).subscribe({
        next: () => {
          this.loadTimeEntries();
          this.showSnackBar('Time entry deleted successfully');
        },
        error: (error) => {
          console.error('Error deleting time entry:', error);
          this.showSnackBar('Error deleting time entry');
        }
      });
    }
  }

  private showSnackBar(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }
}
