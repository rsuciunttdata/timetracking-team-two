import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class NavbarComponent {
  isLoggedIn = false;

  constructor(public router: Router) {}

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  navigateToHome() {
    this.router.navigate(['/']);
  }

  logout() {
    this.isLoggedIn = false;
    this.router.navigate(['/login']);
  }

  isDashboardPage(): boolean {
    this.isLoggedIn = true
    return this.router.url === '/dashboard';
  }
}
