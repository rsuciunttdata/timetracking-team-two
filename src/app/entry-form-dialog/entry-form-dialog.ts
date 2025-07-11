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
    status: 'pending',
    rejectionMessage: ''
  };

  constructor(
    public dialogRef: MatDialogRef<EntryFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private timeEntryService: TimeEntryService
  ) {
    if (data && data.entry) {
      this.entry = { ...data.entry };
    }
  }

  submit() {
    if (!this.entry.date || !this.entry.startTime || !this.entry.endTime) {
      alert('Please fill in all required fields.');
      return;
    }

    const start = this.entry.startTime;
    const end = this.entry.endTime;
    const breakMinutes = this.entry.break ? parseInt(this.entry.break, 10) || 0 : 0;
    let total = 0;
    if (start && end) {
      const [startHour, startMinute] = start.split(':').map(Number);
      const [endHour, endMinute] = end.split(':').map(Number);
      total = ((endHour * 60 + endMinute) - (startHour * 60 + startMinute)) - breakMinutes;
      if (total < 0) total = 0;
    }

    const newEntry = {
      ...this.entry,
      status: this.entry.status as 'pending' | 'draft' | 'accepted' | 'rejected',
      total: total.toString(),
      description: ''
    };

    this.timeEntryService.createTimeEntry(newEntry).subscribe({
      next: (createdEntry) => {
        this.dialogRef.close(createdEntry);
      },
      error: () => {
        alert('Failed to add entry. Please try again.');
      }
    });
  }

  cancel() {
    this.dialogRef.close();
  }
}
