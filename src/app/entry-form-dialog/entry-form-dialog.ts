import { Component, Inject, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TimeEntryService } from '../services/time-entry.service';
import { EntryRefreshService } from '../services/entry-refresh.service';
import { TimeEntry } from '../models/time-entry.model';

interface DialogData {
  entry?: TimeEntry;
  isEditMode?: boolean;
}

@Component({
  selector: 'app-entry-form-dialog',
  standalone: true,
  templateUrl: './entry-form-dialog.html',
  styleUrls: ['./entry-form-dialog.css'],
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ]
})
export class EntryFormDialogComponent {
  entry = {
    date: '',
    project: '',
    startTime: '',
    endTime: '',
    break: '',
    status: 'draft' as 'draft' | 'pending' | 'accepted' | 'rejected',
    rejectionMessage: '',
    description: ''
  };
  breakHours: number = 0;
  breakMinutes: number = 0;
  isEditMode = false;
  dialogTitle = 'Add New Entry';
  submitButtonText = 'Add Entry';
  maxDate: string;

  private refreshService = inject(EntryRefreshService);

  constructor(
    public dialogRef: MatDialogRef<EntryFormDialogComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private timeEntryService: TimeEntryService
  ) {
    this.maxDate = new Date().toISOString().split('T')[0];

    if (data?.entry) {
      this.isEditMode = true;
      this.dialogTitle = 'Edit Entry';
      this.submitButtonText = 'Update Entry';

      this.entry = {
        date: data.entry.date || '',
        project: data.entry.project || '',
        startTime: data.entry.startTime || '',
        endTime: data.entry.endTime || '',
        break: data.entry.break || '',
        status: data.entry.status || 'draft',
        rejectionMessage: data.entry.rejectionMessage || '',
        description: data.entry.description || ''
      };
    }
  }

  ngOnInit(): void {
    if (this.entry?.break) {
      this.breakHours = Math.floor(parseInt(this.entry.break) / 60);
      this.breakMinutes = parseInt(this.entry.break) % 60;
    }
    this.initializeBreakInputs();
  }

  submit() {
    if (!this.entry.date || !this.entry.startTime) {
      this.showSnackBar('Please fill in all required fields (Date, Project, Start Time, End Time)', 'error');
      return;
    }

    const uuid = localStorage.getItem('uuid');
    if (!uuid) {
      this.showSnackBar('User ID is missing. Please log in again.', 'error');
      return;
    }

    const total = this.calculateTotal();
    const payload = {
      ...this.entry,
      total: total,
      description: this.entry.description || ''
    };

    // console.log(`Break hour from form: ${this.breakHours}, Break minutes from form: ${this.breakMinutes}`);

    if (this.isEditMode) {
      this.timeEntryService.updateTimeEntry(this.data.entry.id, payload).subscribe({
        next: () => {
          this.showSnackBar('Entry updated successfully!', 'success');
          this.refreshService.triggerRefresh();
          this.dialogRef.close();
        },
        error: (error) => this.handleBackendError(error)
      });
    } else {
      this.timeEntryService.createTimeEntry(payload, uuid).subscribe({
        next: () => {
          this.showSnackBar('Entry created successfully!', 'success');
          this.refreshService.triggerRefresh();
          this.dialogRef.close();
        },
        error: (error) => this.handleBackendError(error)
      });
    }
  }

  cancel() {
    this.dialogRef.close();
  }

  private calculateTotal(): string {
    const [startHour, startMinute] = this.entry.startTime.split(':').map(Number);
    const [endHour, endMinute] = this.entry.endTime.split(':').map(Number);

    let totalMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
    totalMinutes -= this.parseBreakTime(this.entry.break);

    totalMinutes = Math.max(totalMinutes, 0);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours}h ${minutes}m`;
  }

  private parseBreakTime(breakTime: string): number {
    const trimmed = (breakTime || '').trim();
    const fullFormatRegex = /^(\d+)h\s+(\d+)m$/;
    const hoursOnlyRegex = /^(\d+)h$/;
    const minutesOnlyRegex = /^(\d+)m$/;

    let hours = 0, minutes = 0;

    if (fullFormatRegex.test(trimmed)) {
      const match = trimmed.match(fullFormatRegex);
      hours = parseInt(match![1]);
      minutes = parseInt(match![2]);
    } else if (hoursOnlyRegex.test(trimmed)) {
      const match = trimmed.match(hoursOnlyRegex);
      hours = parseInt(match![1]);
    } else if (minutesOnlyRegex.test(trimmed)) {
      const match = trimmed.match(minutesOnlyRegex);
      minutes = parseInt(match![1]);
    }

    return hours * 60 + minutes;
  }

  updateBreakMinutes(): void {
    const totalMinutes = (this.breakHours || 0) * 60 + (this.breakMinutes || 0);
    this.entry.break = totalMinutes.toString();
    console.log(`Break hour from form: ${this.breakHours}, Break minutes from form: ${this.breakMinutes}`);
  }

  initializeBreakInputs(): void {
    const totalMinutes = parseInt(this.entry.break || '0', 10);
    this.breakHours = Math.floor(totalMinutes / 60);
    this.breakMinutes = totalMinutes % 60;
  }

  private showSnackBar(message: string, type: 'success' | 'error' | 'info' = 'info') {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: [`snackbar-${type}`]
    });
  }

  private handleBackendError(error: any) {
    console.error('Backend error:', error);
    const details = error?.error?.details;
    const message = details?.length ? details.join('\n') :
      error?.error?.message || 'Something went wrong. Please try again.';
    this.showSnackBar(message, 'error');
  }
}
