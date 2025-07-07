import { Component, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { EntryFormDialogComponent } from '../entry-form-dialog/entry-form-dialog';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

export interface TimeEntry {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  break: string;
  total: string;
  status: 'draft' | 'pending' | 'accepted' | 'rejected';
  project: string;
  description: string;
}

@Component({
  selector: 'app-entry-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule
  ],
  templateUrl: './entry-table.component.html',
  styleUrls: ['./entry-table.component.css']
})
export class EntryTableComponent implements OnInit, AfterViewInit {
  
  displayedColumns: string[] = ['date', 'startTime', 'endTime', 'break', 'total', 'status', 'actions'];
  dataSource = new MatTableDataSource<TimeEntry>();
  
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private dialog: MatDialog) {}
  
  timeEntries: TimeEntry[] = [
    {
      id: 1,
      date: '2025-07-03',
      startTime: '09:00',
      endTime: '17:30',
      break: '1h 00m',
      total: '7h 30m',
      status: 'accepted',
      project: 'Project Alpha',
      description: 'Bug fixing and code review'
    },
    {
      id: 2,
      date: '2025-07-03',
      startTime: '08:30',
      endTime: '12:00',
      break: '30m',
      total: '3h 00m',
      status: 'draft',
      project: 'Project Beta',
      description: 'UI development'
    },
    {
      id: 3,
      date: '2025-07-02',
      startTime: '10:00',
      endTime: '15:00',
      break: '45m',
      total: '4h 15m',
      status: 'pending',
      project: 'Project Gamma',
      description: 'Database optimization'
    },
    {
      id: 4,
      date: '2025-07-02',
      startTime: '14:00',
      endTime: '18:00',
      break: '15m',
      total: '3h 45m',
      status: 'accepted',
      project: 'Project Alpha',
      description: 'Testing and documentation'
    },
    {
      id: 5,
      date: '2025-07-01',
      startTime: '09:15',
      endTime: '17:00',
      break: '1h 15m',
      total: '6h 30m',
      status: 'accepted',
      project: 'Project Beta',
      description: 'Feature implementation'
    }
  ];

  selectedEntry: any = null;
  isEditMode: boolean = false;
  
  ngOnInit() {
    this.dataSource.data = this.timeEntries;
  }
  
  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
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
        const newEntry: TimeEntry = {
          id: this.timeEntries.length + 1,
          ...result
        };
        this.timeEntries.push(newEntry);
        this.dataSource.data = [...this.timeEntries];
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
        const index = this.timeEntries.findIndex(e => e.id === entry.id);
        if (index !== -1) {
          this.timeEntries[index] = { ...this.timeEntries[index], ...result };
          this.dataSource.data = [...this.timeEntries];
        }
      }
    });
  }

  deleteEntry(entry: TimeEntry) {
    console.log('Delete entry:', entry);
    this.timeEntries = this.timeEntries.filter(e => e.id !== entry.id);
    this.dataSource.data = [...this.timeEntries];
  }
}