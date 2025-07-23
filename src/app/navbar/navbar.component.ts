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
  constructor(public router: Router) {}

   isLoggedIn = false;

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  isLoginPage(): boolean {
    return this.router.url === '/login';
  }

  navigateToHome() {
  this.router.navigate(['/']);
  }

 logout() {
    // your logout logic, e.g., clear tokens/session
    this.isLoggedIn = false;
    // redirect or update UI as needed
  }

}
