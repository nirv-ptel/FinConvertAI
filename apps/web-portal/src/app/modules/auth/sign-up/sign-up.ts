import { Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from 'app/core/auth';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    RouterLink
  ],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.scss',
})
export class SignUp {
  private _authService = inject(AuthService);
  private _formBuilder = inject(FormBuilder);
  private _router = inject(Router);
  private _destroyRef = inject(DestroyRef);

  signupForm: FormGroup;
  otpForm: FormGroup;

  step: 'signup' | 'otp' = 'signup';
  loading = false;
  errorMessage = '';

  constructor() {
    this.signupForm = this._formBuilder.group({
      name: ['', [Validators.required, Validators.pattern(/^[A-Za-z\s]+$/)]],
      email: ['', [Validators.required, Validators.email]],
      mobile: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.otpForm = this._formBuilder.group({
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });
  }

  submitSignup(): void {
    if (this.signupForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';

    this._authService.signUp(this.signupForm.value).pipe(takeUntilDestroyed(this._destroyRef)).subscribe({
      next: () => {
        this.step = 'otp';
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || err.error?.error || 'Signup failed. Please try again.';
        this.loading = false;
      }
    });
  }

  verifyOtp(): void {
    if (this.otpForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';

    const email = this.signupForm.get('email')?.value;
    const otp = this.otpForm.get('otp')?.value;

    this._authService.verifyOtp(email, otp).pipe(takeUntilDestroyed(this._destroyRef)).subscribe({
      next: () => {
        this._router.navigateByUrl('/signed-in-redirect');
      },
      error: (err) => {
        this.errorMessage = err.error?.message || err.error?.error || 'Invalid OTP. Please try again.';
        this.loading = false;
      }
    });
  }

  resendOtp(): void {
    const email = this.signupForm.get('email')?.value;
    this._authService.resendOtp(email).subscribe();
  }
}
