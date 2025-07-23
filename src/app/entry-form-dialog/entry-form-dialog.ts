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
    status: 'pending' as 'draft' | 'pending' | 'accepted' | 'rejected',
    rejectionMessage: '',
    description: ''
  };

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

    if (data && data.entry) {
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
    } else {
      this.isEditMode = false;
      this.dialogTitle = 'Add New Entry';
      this.submitButtonText = 'Add Entry';

      this.entry.status = 'draft';
    }
  }

  submit() {
    if (!this.entry.date || !this.entry.startTime || !this.entry.endTime || !this.entry.break) {
      this.showSnackBar('Please fill in all required fields (Date, Start Time, End Time, Break Duration)', 'error');
      return;
    }

    if (!this.isValidDate()) {
      this.showSnackBar('Date cannot be in the future. Please select today or a past date.', 'error');
      return;
    }

    if (this.entry.startTime >= this.entry.endTime) {
      this.showSnackBar('End time must be after start time', 'error');
      return;
    }

    if (!this.isValidBreakFormat()) {
      this.showSnackBar('Break format must be like "1h 30m", "2h", or "45m" (hours: 0-8, minutes: 0-59)', 'error');
      return;
    }

    if (!this.isBreakTimeLessThanWorkedTime()) {
      this.showSnackBar('Break duration cannot be equal to or greater than the total worked time', 'error');
      return;
    }

    const total = this.calculateTotal();

    if (this.isEditMode) {
      const updateData = {
        ...this.entry,
        id: this.data.entry!.id,
        total: total,
        description: this.entry.description || ''
      };

      this.timeEntryService.updateTimeEntry(this.data.entry!.id, updateData).subscribe({
        next: () => {
          this.showSnackBar('Entry updated successfully!', 'success');
          this.refreshService.triggerRefresh();
          this.dialogRef.close();
        },
        error: (error) => {
          console.error('Error updating entry:', error);
          this.showSnackBar('Failed to update entry. Please try again.', 'error');
        }
      });
    } else {
      const createData = {
        ...this.entry,
        total: total,
        description: this.entry.description || ''
      };

      this.timeEntryService.createTimeEntry(createData).subscribe({
        next: () => {
          this.showSnackBar('Entry created successfully!', 'success');
          this.refreshService.triggerRefresh();
          this.dialogRef.close();
        },
        error: (error) => {
          console.error('Error creating entry:', error);
          this.showSnackBar('Failed to create entry. Please try again.', 'error');
        }
      });
    }
  }

  cancel() {
    this.dialogRef.close();
  }

  private isValidDate(): boolean {
    if (!this.entry.date) return false;

    const selectedDate = new Date(this.entry.date);
    const today = new Date();

    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    return selectedDate <= today;
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

  private isBreakTimeLessThanWorkedTime(): boolean {
    const [startHour, startMinute] = this.entry.startTime.split(':').map(Number);
    const [endHour, endMinute] = this.entry.endTime.split(':').map(Number);

    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;
    const totalWorkedMinutes = endTotalMinutes - startTotalMinutes;

    const breakMinutes = this.parseBreakTime(this.entry.break);
    return breakMinutes < totalWorkedMinutes;
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
    const trimmed = breakTime.trim();
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

  private showSnackBar(message: string, type: 'success' | 'error' | 'info' = 'info') {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: [`snackbar-${type}`]
    });
  }
}
