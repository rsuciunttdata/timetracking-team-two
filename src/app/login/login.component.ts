import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  showPassword = false;
  loginError = '';

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      employeeId: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get employeeId() { return this.loginForm.get('employeeId'); }
  get password() { return this.loginForm.get('password'); }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
  if (this.loginForm.valid && !this.isLoading) {
    this.isLoading = true;
    this.loginError = '';

    setTimeout(() => {
      const { employeeId, password } = this.loginForm.value;

      if (employeeId === 'demo' && password === 'password') {
        // ✅ Mark user as logged in
        localStorage.setItem('isLoggedIn', 'true');

        // Redirect to dashboard
        this.router.navigate(['/dashboard']);
      } else {
        this.loginError = 'Invalid employee ID or password. Please try again.';
      }

      this.isLoading = false;
    }, 1500);
  } else {
    Object.keys(this.loginForm.controls).forEach(key => {
      this.loginForm.get(key)?.markAsTouched();
    });
  }
}


  navigateToHome(): void {
    this.router.navigate(['/']);
  }

  contactAdmin(): void {
    alert('Please contact your system administrator for account assistance.');
  }

  getFieldErrorMessage(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    
    if (field?.hasError('required')) {
      return `${fieldName === 'employeeId' ? 'Employee ID' : 'Password'} is required`;
    }
    
    if (field?.hasError('minlength')) {
      const minLength = field.errors?.['minlength'].requiredLength;
      return `Must be at least ${minLength} characters long`;
    }
    
    return '';
  }
}