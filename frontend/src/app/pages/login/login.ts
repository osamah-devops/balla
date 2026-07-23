import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { provideIcons, NgIcon } from '@ng-icons/core';
import { faSolidLock, faSolidEnvelope, faSolidRightToBracket } from '@ng-icons/font-awesome/solid';
import { AuthService } from '../../services/auth.service';
import { UserRole } from '../../models/user.model';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, NgIcon],
  templateUrl: './login.html',
  styleUrl: './login.css',
  providers: [provideIcons({ faSolidLock, faSolidEnvelope, faSolidRightToBracket })],
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly submitting = signal(false);
  readonly errorMessage = signal('');

  /** Set once the password step returns an MFA challenge; switches the form to code entry. */
  readonly mfaSession = signal<{ email: string; session: string } | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    rememberMe: [true],
  });

  readonly mfaForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { email, password, rememberMe } = this.form.getRawValue();
    this.submitting.set(true);
    this.errorMessage.set('');
    this.authService.login(email, password, rememberMe).subscribe({
      next: (result) => {
        this.submitting.set(false);
        if (result.mfaRequired) {
          this.mfaSession.set({ email: result.email, session: result.session });
          return;
        }
        this.redirectAfterLogin(result.user.role);
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(this.describeError(err));
      },
    });
  }

  submitMfaCode(): void {
    const mfaSession = this.mfaSession();
    if (this.mfaForm.invalid || !mfaSession) {
      this.mfaForm.markAllAsTouched();
      return;
    }
    const { code } = this.mfaForm.getRawValue();
    this.submitting.set(true);
    this.errorMessage.set('');
    this.authService.completeMfaLogin(mfaSession.email, mfaSession.session, code).subscribe({
      next: (user) => {
        this.submitting.set(false);
        this.redirectAfterLogin(user.role);
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(this.describeError(err));
      },
    });
  }

  cancelMfa(): void {
    this.mfaSession.set(null);
    this.mfaForm.reset({ code: '' });
    this.errorMessage.set('');
  }

  private redirectAfterLogin(role: UserRole): void {
    const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo');
    this.router.navigateByUrl(redirectTo || this.defaultRouteForRole(role));
  }

  private defaultRouteForRole(role: UserRole): string {
    switch (role) {
      case 'admin':
        return '/admin-dashboard';
      case 'seller':
        return '/seller-dashboard';
      default:
        return '/home';
    }
  }

  private describeError(err: unknown): string {
    const status = (err as { status?: number })?.status;
    const message = (err as { error?: { message?: string } })?.error?.message;
    if (status === 403) {
      return message || 'Please confirm your email before signing in.';
    }
    return message || 'Invalid email or password.';
  }
}
