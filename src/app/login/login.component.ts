import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserAuthService, User} from '../services/auth.service';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule]
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  showPassword = false;
  loginError = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: UserAuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.loginError = '';

      const { email, password } = this.loginForm.value;

      this.authService.getUsers().subscribe({
        next: (users: User[]) => {
          const matchedUser = users.find(
            u => u.email === email && u.password === password
          );

          if (matchedUser) {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('uuid', matchedUser.uuid);
            this.router.navigate(['/dashboard']);
          } else {
            this.loginError = 'Invalid email or password.';
          }

          this.isLoading = false;
        },
        error: () => {
          this.loginError = 'Error loading user data.';
          this.isLoading = false;
        }
      });
    } else {
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }



  logout(): void {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('uuid');
    this.router.navigate(['/login']);
  }
}
