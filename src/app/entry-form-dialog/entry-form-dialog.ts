import { environment } from './../environments/environment';
import { getStatusText, STATUS_MAP, TimeEntry } from './../models/time-entry.model';
import { Component, Inject, inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
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
    ReactiveFormsModule,
    FormsModule, 
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ]
})
export class EntryFormDialogComponent implements OnInit {
  entryForm!: FormGroup;
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

  private refreshService = inject(EntryRefreshService);

  constructor(
    public dialogRef: MatDialogRef<EntryFormDialogComponent>,
    private snackBar: MatSnackBar,
    private formBuilder: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private timeEntryService: TimeEntryService
  ) {
    this.maxDate = new Date().toISOString().split('T')[0];
    this.allEntries = data?.allEntries || [];
    this.isEditMode = !!data?.entry;
    
    if (this.isEditMode) {
      this.dialogTitle = 'Edit Entry';
      this.submitButtonText = 'Update Entry';
    }

    this.initializeForm();
  }

  ngOnInit(): void {
    if (this.data?.entry) {
      this.loadEntryData(this.data.entry);
    }
    this.setupFormSubscriptions();
  }

  private initializeForm(): void {
    this.entryForm = this.formBuilder.group({
      id: [''],
      date: ['', [Validators.required, this.dateValidator.bind(this)]],
      project: [''],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      break: ['0'],
      status: [1],
      rejectionMessage: [''],
      description: ['']
    }, { 
      validators: [this.timeRangeValidator.bind(this), this.breakTimeValidator.bind(this)]
    });
  }

  private loadEntryData(entry: TimeEntry): void {
    this.entryForm.patchValue({
      id: entry.id || '',
      date: entry.date || '',
      project: entry.project || '',
      startTime: entry.startTime || '',
      endTime: entry.endTime || '',
      break: entry.break || '0',
      status: entry.status || 1,
      rejectionMessage: entry.rejectionMessage || '',
      description: entry.description || ''
    });

    
    if (entry.break) {
      const totalMinutes = parseInt(entry.break, 10);
      this.breakHours = Math.floor(totalMinutes / 60);
      this.breakMinutes = totalMinutes % 60;
    }
  }

  private setupFormSubscriptions(): void {

    this.entryForm.get('date')?.valueChanges.subscribe(date => {
      if (date) {
        this.onDateChange(date);
      }
    });

  
    this.entryForm.get('startTime')?.valueChanges.subscribe(() => {
      this.entryForm.updateValueAndValidity();
    });

    this.entryForm.get('endTime')?.valueChanges.subscribe(() => {
      this.entryForm.updateValueAndValidity();
    });
  }

 
  private dateValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return { required: true };
    }
    
    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(23, 59, 59, 999); 
    
    if (selectedDate > today) {
      return { futureDate: true };
    }
    
    return null;
  }

  private timeRangeValidator(group: AbstractControl): ValidationErrors | null {
    const startTime = group.get('startTime')?.value;
    const endTime = group.get('endTime')?.value;

    if (!startTime || !endTime) {
      return null;
    }

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;

    if (endTotalMinutes <= startTotalMinutes) {
      return { invalidTimeRange: true };
    }

    return null;
  }

  private breakTimeValidator(group: AbstractControl): ValidationErrors | null {
    const startTime = group.get('startTime')?.value;
    const endTime = group.get('endTime')?.value;
    const breakTime = group.get('break')?.value;

    if (!startTime || !endTime || !breakTime) {
      return null;
    }

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const workedMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
    const breakMinutes = parseInt(breakTime, 10);

    if (breakMinutes >= workedMinutes) {
      return { breakTooLong: true };
    }

    return null;
  }

  getFieldError(fieldName: string): string | null {
    const field = this.entryForm.get(fieldName);
    
    if (!field || !field.errors || !field.touched) {
      return null;
    }

    const errors = field.errors;
    
    if (errors['required']) {
      return this.getRequiredMessage(fieldName);
    }
    if (errors['futureDate']) {
      return 'Date cannot be in the future.';
    }
    
    return null;
  }

  getFormError(): string | null {
    if (!this.entryForm.errors || !this.entryForm.touched) {
      return null;
    }

    const errors = this.entryForm.errors;
    
    if (errors['invalidTimeRange']) {
      return 'End time must be after start time.';
    }
    if (errors['breakTooLong']) {
      return 'Break time cannot be equal to or longer than worked time.';
    }
    
    return null;
  }

  private getRequiredMessage(fieldName: string): string {
    const messages: Record<string, string> = {
      date: 'Date is required.',
      startTime: 'Start time is required.',
      endTime: 'End time is required.'
    };
    return messages[fieldName] || `${fieldName} is required.`;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.entryForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  hasFormError(): boolean {
    return !!(this.entryForm.errors && this.entryForm.touched);
  }


  updateBreakMinutes(): void {
    const totalMinutes = (this.breakHours || 0) * 60 + (this.breakMinutes || 0);
    this.entryForm.patchValue({ break: totalMinutes.toString() });
  }

  onBreakHoursChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = parseInt(target.value, 10) || 0;
    this.breakHours = Math.max(0, Math.min(8, value));
    this.updateBreakMinutes();
  }

  onBreakMinutesChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = parseInt(target.value, 10) || 0;
    this.breakMinutes = Math.max(0, Math.min(59, value));
    this.updateBreakMinutes();
  }

  
  onDateChange(selectedDate: string): void {
    if (!selectedDate) return;

    const existingEntry = this.allEntries.find(entry => entry.date === selectedDate);

    if (existingEntry && (!this.isEditMode || existingEntry.id !== this.data.entry?.id)) {
      
      this.entryForm.patchValue({
        id: existingEntry.id,
        date: selectedDate,
        project: existingEntry.project || '',
        startTime: existingEntry.startTime || '',
        endTime: existingEntry.endTime || '',
        break: existingEntry.break || '0',
        status: 1,
        rejectionMessage: '',
        description: existingEntry.description || ''
      });

      if (existingEntry.break) {
        const totalMinutes = parseInt(existingEntry.break, 10);
        this.breakHours = Math.floor(totalMinutes / 60);
        this.breakMinutes = totalMinutes % 60;
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


  submit(): void {
    this.entryForm.markAllAsTouched();

    if (this.entryForm.invalid) {
      const firstError = this.getFormError() || this.getFirstFieldError();
      this.showSnackBar(firstError || 'Please fix the form errors before submitting.', 'error');
      return;
    }

    const uuid = localStorage.getItem('uuid');
    if (!uuid) {
      this.showSnackBar('User ID is missing. Please log in again.', 'error');
      return;
    }

    const formValue = this.entryForm.value;
    const payload = {
      ...formValue,
      description: formValue.description || '',
      status: formValue.status || 1,
    };

    if (this.isEditMode) {
      this.timeEntryService.updateTimeEntry(this.data.entry!.id!, payload).subscribe({
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

  private getFirstFieldError(): string | null {
    const fields = ['date', 'startTime', 'endTime'];
    for (const fieldName of fields) {
      const error = this.getFieldError(fieldName);
      if (error) return error;
    }
    return null;
  }

  private handleBackendError(error: any): void {
    console.error('Backend error:', error);
    const details = error?.error?.details;
    const message = details?.length ? details.join('\n') :
      error?.error?.message || 'Something went wrong. Please try again.';
    this.showSnackBar(message, 'error');
  }

  cancel(): void {
    this.dialogRef.close();
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

  private showSnackBar(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: [`snackbar-${type}`]
    });
  }
}