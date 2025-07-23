import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home-page.html',
  styleUrls: ['./home-page.css']
})
export class HomeComponent {
  features = [
    {
      icon: '⏰',
      title: 'Smart Time Tracking',
      description: 'Effortlessly track your work hours with our intuitive interface and automated features.'
    },
    {
      icon: '📊',
      title: 'Detailed Reports',
      description: 'Generate comprehensive reports to analyze productivity and project time allocation.'
    },
    {
      icon: '👥',
      title: 'Team Management',
      description: 'Administrators can easily manage team members and monitor company-wide productivity.'
    },
    {
      icon: '🔒',
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with admin-controlled access and data protection.'
    }
  ];

  constructor(private router: Router) {}

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  scrollToFeatures(): void {
    const element = document.getElementById('features');
    element?.scrollIntoView({ behavior: 'smooth' });
  }
}