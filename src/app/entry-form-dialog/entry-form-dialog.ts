import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TimeEntryService } from '../services/time-entry.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TimeEntry } from '../models/time-entry.model';

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

  constructor(
    public dialogRef: MatDialogRef<EntryFormDialogComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private timeEntryService: TimeEntryService
  ) {
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
    if (!this.entry.date || !this.entry.startTime || !this.entry.endTime) {
      this.showSnackBar('Please fill in all required fields (Date, Start Time, End Time)', 'error');
      return;
    }

    if (this.entry.startTime >= this.entry.endTime) {
      this.showSnackBar('End time must be after start time', 'error');
      return;
    }

    const total = this.calculateTotal();

    if (this.isEditMode) {
      const updateData = {
        ...this.entry,
        id: this.data.entry.id,
        total: total,
        description: this.entry.description || ''
      };

      this.timeEntryService.updateTimeEntry(this.data.entry.id, updateData).subscribe({
        next: (updatedEntry) => {
          this.showSnackBar('Entry updated successfully!', 'success');
          this.dialogRef.close(updatedEntry);
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
        next: (createdEntry) => {
          this.showSnackBar('Entry created successfully!', 'success');
          this.dialogRef.close(createdEntry);
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

  private calculateTotal(): string {
    const start = this.entry.startTime;
    const end = this.entry.endTime;
    const breakTime = this.entry.break || '0';

    if (!start || !end) return '0h 0m';

    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);

    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;
    let totalMinutes = endTotalMinutes - startTotalMinutes;

    const breakMinutes = this.parseBreakTime(breakTime);
    totalMinutes -= breakMinutes;

    if (totalMinutes < 0) totalMinutes = 0;

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours}h ${minutes}m`;
  }

  private parseBreakTime(breakTime: string): number {
    if (!breakTime) return 0;

    const hoursMatch = breakTime.match(/(\d+)h/);
    const minutesMatch = breakTime.match(/(\d+)m/);

    const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
    const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;

    return hours * 60 + minutes;
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