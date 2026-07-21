import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { provideIcons, NgIcon } from '@ng-icons/core';
import { faSolidEnvelope, faSolidLock } from '@ng-icons/font-awesome/solid';
import { AuthService } from '../../services/auth.service';

// Mirrors the Cognito user pool password policy in infrastructure/auth.tf.
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/;

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get('newPassword')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password && confirmPassword && password !== confirmPassword ? { passwordMismatch: true } : null;
}

type Step = 'request' | 'reset' | 'done';

@Component({
  selector: 'app-forget-password',
  imports: [ReactiveFormsModule, RouterLink, NgIcon],
  templateUrl: './forget-password.html',
  styleUrl: './forget-password.css',
  providers: [provideIcons({ faSolidEnvelope, faSolidLock })],
})
export class ForgetPassword {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly step = signal<Step>('request');
  readonly submitting = signal(false);
  readonly errorMessage = signal('');

  readonly requestForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  readonly resetForm = this.fb.nonNullable.group(
    {
      code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
      newPassword: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatch },
  );

  requestCode(): void {
    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.errorMessage.set('');
    const { email } = this.requestForm.getRawValue();
    this.authService.forgotPassword({ email }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.step.set('reset');
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(this.describeError(err, 'Could not send a reset code. Please try again.'));
      },
    });
  }

  resendCode(): void {
    const { email } = this.requestForm.getRawValue();
    this.authService.forgotPassword({ email }).subscribe();
  }

  submitReset(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.errorMessage.set('');
    const { email } = this.requestForm.getRawValue();
    const { code, newPassword } = this.resetForm.getRawValue();
    this.authService.resetPassword({ email, code, newPassword }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.step.set('done');
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(this.describeError(err, 'That code is invalid or expired.'));
      },
    });
  }

  goToLogin(): void {
    this.router.navigateByUrl('/login');
  }

  private describeError(err: unknown, fallback: string): string {
    const message = (err as { error?: { message?: string } })?.error?.message;
    return message || fallback;
  }
}
