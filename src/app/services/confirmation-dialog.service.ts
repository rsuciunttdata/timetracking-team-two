import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../confirmation-dialog/confirmation-dialog';

@Injectable({
  providedIn: 'root'
})
export class ConfirmationDialogService {

  constructor(private dialog: MatDialog) {}

  confirm(data: ConfirmationDialogData): Observable<boolean> {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: data.type === 'danger' ? '500px' : '450px',
      data: data,
      disableClose: true
    });

    return dialogRef.afterClosed();
  }

  confirmDelete(itemName: string, details?: string): Observable<boolean> {
    return this.confirm({
      title: 'Confirm Deletion',
      message: `Are you sure you want to delete "${itemName}"?`,
      subMessage: details ? `${details}\n\nThis action cannot be undone.` : 'This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      icon: 'delete_forever'
    });
  }

  confirmWarning(title: string, message: string, subMessage?: string): Observable<boolean> {
    return this.confirm({
      title: title,
      message: message,
      subMessage: subMessage,
      confirmText: 'Continue',
      cancelText: 'Cancel',
      type: 'warning',
      icon: 'warning'
    });
  }

  confirmInfo(title: string, message: string, subMessage?: string): Observable<boolean> {
    return this.confirm({
      title: title,
      message: message,
      subMessage: subMessage,
      confirmText: 'OK',
      cancelText: 'Cancel',
      type: 'info',
      icon: 'info'
    });
  }
}
