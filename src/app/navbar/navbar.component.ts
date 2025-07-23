import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class NavbarComponent implements OnInit {
  isLoggedIn = false;

  constructor(public router: Router) {}

  ngOnInit(): void {
    this.isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    // Optional: listen to route changes and update state dynamically
    this.router.events.subscribe(() => {
      this.isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    });
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  navigateToHome() {
    this.router.navigate(['/']);
  }

  navigateToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  logout() {
    localStorage.removeItem('isLoggedIn');
    this.isLoggedIn = false;
    this.router.navigate(['/login']);
  }

  isDashboardPage(): boolean {
  return this.router.url === '/dashboard';
}

}
