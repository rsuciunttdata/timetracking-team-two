import { environment } from './../environments/environment';
import { getStatusText, STATUS_MAP, TimeEntry } from './../models/time-entry.model';
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

interface DialogData {
  entry?: TimeEntry;
  isEditMode?: boolean;
  allEntries?: TimeEntry[];
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
  entry: TimeEntry = {} as TimeEntry;
  breakHours: number = 0;
  breakMinutes: number = 0;
  isEditMode = false;
  dialogTitle = 'Add New Entry';
  submitButtonText = 'Add Entry';
  maxDate: string;
  showDataLoadedNotification = false;
  allEntries: TimeEntry[] = [];
  currentEntryId: string | null = null;
  originalEntry: TimeEntry | null = null;

  fieldTouched = {
    id: false,
    date: false,
    project: false,
    startTime: false,
    endTime: false,
    break: false,
    status: false,
    rejectionMessage: false,
    description: false
  };

  private refreshService = inject(EntryRefreshService);

  constructor(
    public dialogRef: MatDialogRef<EntryFormDialogComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private timeEntryService: TimeEntryService
  ) {
    this.maxDate = new Date().toISOString().split('T')[0];
    this.allEntries = data?.allEntries || [];

    if (data?.entry) {
      this.isEditMode = true;
      this.dialogTitle = 'Edit Entry';
      this.submitButtonText = 'Update Entry';

      this.entry = {
        id: data.entry.id,
        date: data.entry.date || '',
        project: data.entry.project || '',
        startTime: data.entry.startTime || '',
        endTime: data.entry.endTime || '',
        break: data.entry.break || '',
        status: data.entry.status || 1,
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

  getStatusText(statusNumber: number): string {
    return getStatusText(statusNumber);
  }

  getStatusOptions() {
    return Object.entries(STATUS_MAP).map(([key, value]) => ({
      value: parseInt(key),
      label: value
    }));
  }

  submit() {
    this.data.entry = this.entry;

    if (!this.entry.date || !this.entry.startTime || !this.entry.endTime) {
      this.showSnackBar('Please fill in all required fields (Date, Start Time, End Time)', 'error');
      return;
    }

    const [startHour, startMinute] = this.entry.startTime.split(':').map(Number);
    const [endHour, endMinute] = this.entry.endTime.split(':').map(Number);

    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;

    if (endTotalMinutes <= startTotalMinutes) {
      this.showSnackBar('End time must be after start time.', 'error');
      return;
    }

    const workedMinutes = endTotalMinutes - startTotalMinutes;
    const breakMinutes = parseInt(this.entry.break || '0', 10);

    if (breakMinutes >= workedMinutes) {
      this.showSnackBar('Break time cannot be equal to or longer than worked time.', 'error');
      return;
    }

    const uuid = localStorage.getItem('uuid');
    if (!uuid) {
      this.showSnackBar('User ID is missing. Please log in again.', 'error');
      return;
    }

    const payload = {
      ...this.entry,
      description: this.entry.description || '',
      status: this.entry.status || 1,
    };

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


  private handleBackendError(error: any) {
    console.error('Backend error:', error);
    const details = error?.error?.details;
    const message = details?.length ? details.join('\n') :
      error?.error?.message || 'Something went wrong. Please try again.';
    this.showSnackBar(message, 'error');
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

  isFieldInvalid(field: keyof typeof this.entry): boolean {
    return (
      !this.entry[field] &&
      this.fieldTouched[field]
    );
  }

  private isValidBreakFormat(): boolean {
    if (!this.entry.break || this.entry.break.trim() === '') {
      return false;
    }

    const breakTime = this.entry.break.trim();
    const fullFormatRegex = /^(\d+)h\s+(\d+)m$/;
    const hoursOnlyRegex = /^(\d+)h$/;
    const minutesOnlyRegex = /^(\d+)m$/;

    let hours = 0;
    let minutes = 0;

    if (fullFormatRegex.test(breakTime)) {
      const match = breakTime.match(fullFormatRegex);
      hours = parseInt(match![1]);
      minutes = parseInt(match![2]);
    } else if (hoursOnlyRegex.test(breakTime)) {
      const match = breakTime.match(hoursOnlyRegex);
      hours = parseInt(match![1]);
    } else if (minutesOnlyRegex.test(breakTime)) {
      const match = breakTime.match(minutesOnlyRegex);
      minutes = parseInt(match![1]);
    } else {
      return false;
    }

    return hours >= 0 && hours <= 8 && minutes >= 0 && minutes <= 59;
  }

  isBreakInvalid(): boolean {
    return !this.isValidBreakFormat() && this.fieldTouched.break;
  }

  markAllFieldsTouched() {
    (Object.keys(this.fieldTouched) as Array<keyof typeof this.fieldTouched>).forEach(key => {
      this.fieldTouched[key] = true;
    });
  }

  onDateChange(): void {

    if (!this.entry.date) return;

    const existingEntry = this.allEntries.find(entry => entry.date === this.entry.date);

    if (existingEntry) {
      const selectedDate = this.entry.date;

      this.entry = {
        id: existingEntry.id,
        date: selectedDate,
        project: existingEntry.project || '',
        startTime: existingEntry.startTime || '',
        endTime: existingEntry.endTime || '',
        break: existingEntry.break || '',
        status: 1,
        rejectionMessage: '',
        description: existingEntry.description || ''
      };

      if (this.entry.break) {
        this.breakHours = Math.floor(parseInt(this.entry.break) / 60);
        this.breakMinutes = parseInt(this.entry.break) % 60;
      } else {
        this.breakHours = 0;
        this.breakMinutes = 0;
      }

      this.showDataLoadedNotification = true;
      this.showSnackBar('Data found for this date and loaded into the form', 'info');

      setTimeout(() => {
        this.showDataLoadedNotification = false;
      }, 5000);
    } else {
      this.showDataLoadedNotification = false;
    }
  }
}
