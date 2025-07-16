import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { EntryTableComponent } from '../entry-table/entry-table.component';
import { MatDialog } from '@angular/material/dialog';
import { EntryFormDialogComponent } from '../entry-form-dialog/entry-form-dialog';
export interface DayData {
  day: string;
  hours: number;
  percentage: number;
  tasks: number;
  projects: string[];
}

export interface WeeklyStats {
  totalHours: number;
  avgHoursPerDay: number;
  mostProductiveDay: string;
  completedTasks: number;
  activeProjects: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    EntryTableComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent {
  private static instanceCount = 0;
  private instanceId: number;
  private isDialogOpen = false;


  allEntries: EntryTableComponent[] = [];

  weeklyData: DayData[] = [
    {
      day: 'Mon',
      hours: 6.5,
      percentage: 65,
      tasks: 8,
      projects: ['Project Alpha', 'Project Beta']
    },
    {
      day: 'Tue',
      hours: 8.2,
      percentage: 82,
      tasks: 12,
      projects: ['Project Alpha', 'Project Gamma', 'Admin Tasks']
    },
    {
      day: 'Wed',
      hours: 7.1,
      percentage: 71,
      tasks: 9,
      projects: ['Project Beta', 'Project Gamma']
    },
    {
      day: 'Thu',
      hours: 9.3,
      percentage: 93,
      tasks: 15,
      projects: ['Project Alpha', 'Project Beta', 'Project Gamma', 'Meetings']
    },
    {
      day: 'Fri',
      hours: 7.8,
      percentage: 78,
      tasks: 11,
      projects: ['Project Gamma', 'Documentation', 'Code Review']
    },
    {
      day: 'Sat',
      hours: 3.5,
      percentage: 35,
      tasks: 4,
      projects: ['Personal Project', 'Learning']
    },
    {
      day: 'Sun',
      hours: 1.2,
      percentage: 12,
      tasks: 2,
      projects: ['Planning', 'Email']
    }
  ];

  weeklyStats: WeeklyStats = {
    totalHours: 43.6,
    avgHoursPerDay: 6.2,
    mostProductiveDay: 'Thursday',
    completedTasks: 61,
    activeProjects: 5
  };

  todayStats = {
    hoursToday: 8.5,
    hoursYesterday: 6.5,
    tasksCompleted: 12,
    tasksYesterday: 9,
    efficiency: 85,
    efficiencyYesterday: 80
  };

  projectProgress = [
    {
      name: 'Project Alpha',
      progress: 75,
      hoursThisWeek: 18.5,
      estimatedCompletion: '2 days',
      color: 'blue'
    },
    {
      name: 'Project Beta',
      progress: 45,
      hoursThisWeek: 12.3,
      estimatedCompletion: '1 week',
      color: 'green'
    },
    {
      name: 'Project Gamma',
      progress: 90,
      hoursThisWeek: 8.7,
      estimatedCompletion: 'Tomorrow',
      color: 'orange'
    }
  ];

  recentActivity = [
    {
      action: 'Started working on Bug Fix',
      project: 'Project Alpha',
      time: '2 hours ago',
      duration: '2h 15m',
      type: 'start',
      color: 'blue'
    },
    {
      action: 'Completed Illustration task',
      project: 'Project Beta',
      time: '3 hours ago',
      duration: '1h 30m',
      type: 'complete',
      color: 'green'
    },
    {
      action: 'Paused Tax Return filing',
      project: 'Admin Tasks',
      time: '4 hours ago',
      duration: '45m',
      type: 'pause',
      color: 'orange'
    },
    {
      action: 'Meeting with client',
      project: 'Project Gamma',
      time: '5 hours ago',
      duration: '1h 00m',
      type: 'meeting',
      color: 'purple'
    }
  ];

  timeBreakdown = [
    { category: 'Development', hours: 24.5, percentage: 56 },
    { category: 'Meetings', hours: 8.2, percentage: 19 },
    { category: 'Documentation', hours: 6.1, percentage: 14 },
    { category: 'Admin', hours: 3.8, percentage: 9 },
    { category: 'Learning', hours: 1.0, percentage: 2 }
  ];

  constructor(
    private dialog: MatDialog,
  ) {
    this.instanceId = ++DashboardComponent.instanceCount;
    console.log(`DashboardComponent constructed [instance ${this.instanceId}]`);
  }

  

  hasEntries(): boolean {
    return this.allEntries.length > 0;
  }

  getHoursIncrease(): number {
    return this.todayStats.hoursToday - this.todayStats.hoursYesterday;
  }

  getTasksIncrease(): number {
    return this.todayStats.tasksCompleted - this.todayStats.tasksYesterday;
  }

  getEfficiencyIncrease(): number {
    return this.todayStats.efficiency - this.todayStats.efficiencyYesterday;
  }

  getMostProductiveDay(): string {
    return this.weeklyData.reduce((prev, current) =>
      prev.hours > current.hours ? prev : current
    ).day;
  }

  getTotalWeeklyHours(): number {
    return this.weeklyData.reduce((sum, day) => sum + day.hours, 0);
  }

  getAverageHoursPerDay(): number {
    const workDays = this.weeklyData.filter(day =>
      ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(day.day)
    );
    return workDays.reduce((sum, day) => sum + day.hours, 0) / workDays.length;
  }

  formatHours(hours: number): string {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  }

  getProgressColor(progress: number): string {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
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
  
        
      });
    }
}
