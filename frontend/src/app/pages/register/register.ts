import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { provideIcons, NgIcon } from '@ng-icons/core';
import {
  faSolidCamera,
  faSolidEnvelope,
  faSolidLocationDot,
  faSolidLock,
  faSolidUser,
  faSolidUserPlus,
} from '@ng-icons/font-awesome/solid';
import { AuthService } from '../../services/auth.service';
import { UsersService } from '../../services/users.service';
import { US_STATES } from '../../data/us-states';

const ZIP_PATTERN = /^\d{5}(-\d{4})?$/;
// Mirrors the Cognito user pool password policy in infrastructure/auth.tf.
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password && confirmPassword && password !== confirmPassword ? { passwordMismatch: true } : null;
}

type Step = 'details' | 'confirm';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, NgIcon],
  templateUrl: './register.html',
  styleUrl: './register.css',
  providers: [
    provideIcons({ faSolidCamera, faSolidEnvelope, faSolidLocationDot, faSolidLock, faSolidUser, faSolidUserPlus }),
  ],
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly usersService = inject(UsersService);
  private readonly router = inject(Router);

  readonly states = US_STATES;
  readonly step = signal<Step>('details');
  readonly submitting = signal(false);
  readonly errorMessage = signal('');
  readonly profileImagePreview = signal<string | null>(null);
  private profileImageFile: File | null = null;

  readonly detailsForm = this.fb.nonNullable.group(
    {
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      zipCode: ['', [Validators.required, Validators.pattern(ZIP_PATTERN)]],
      state: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]],
      confirmPassword: ['', [Validators.required]],
      sellOnBalla: [false],
      storeName: [''],
    },
    { validators: passwordsMatch },
  );

  readonly confirmForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
  });

  constructor() {
    const storeNameControl = this.detailsForm.controls.storeName;
    this.detailsForm.controls.sellOnBalla.valueChanges.subscribe((sellOnBalla) => {
      storeNameControl.setValidators(sellOnBalla ? [Validators.required, Validators.minLength(2)] : []);
      storeNameControl.updateValueAndValidity();
    });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      this.errorMessage.set('Profile photo must be an image file.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      this.errorMessage.set('Profile photo must be smaller than 5MB.');
      return;
    }
    this.errorMessage.set('');
    this.profileImageFile = file;
    const reader = new FileReader();
    reader.onload = () => this.profileImagePreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  submitDetails(): void {
    if (this.detailsForm.invalid) {
      this.detailsForm.markAllAsTouched();
      return;
    }
    const { name, email, zipCode, state, password, sellOnBalla, storeName } = this.detailsForm.getRawValue();
    this.submitting.set(true);
    this.errorMessage.set('');
    this.authService.register({ name, email, zipCode, state, password, storeName: sellOnBalla ? storeName : undefined }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.step.set('confirm');
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(this.describeError(err, 'Could not create your account.'));
      },
    });
  }

  submitConfirmation(): void {
    if (this.confirmForm.invalid) {
      this.confirmForm.markAllAsTouched();
      return;
    }
    const { email, password } = this.detailsForm.getRawValue();
    const { code } = this.confirmForm.getRawValue();
    this.submitting.set(true);
    this.errorMessage.set('');
    this.authService.confirmRegistration({ email, code }).subscribe({
      next: () => this.loginAfterConfirmation(email, password),
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(this.describeError(err, 'That code is invalid or expired.'));
      },
    });
  }

  resendCode(): void {
    const { email } = this.detailsForm.getRawValue();
    this.authService.resendConfirmationCode({ email }).subscribe();
  }

  private loginAfterConfirmation(email: string, password: string): void {
    this.authService.login(email, password).subscribe({
      next: (result) => {
        // A brand-new account can't have MFA enabled yet (it requires a signed-in
        // session to set up), so this should always be a completed login.
        if (result.mfaRequired) {
          this.submitting.set(false);
          this.router.navigateByUrl('/login');
          return;
        }
        this.uploadImageThenRedirect(result.user.role === 'seller' ? '/seller-dashboard' : '/home');
      },
      error: () => {
        this.submitting.set(false);
        this.router.navigateByUrl('/login');
      },
    });
  }

  private uploadImageThenRedirect(redirectTo: string): void {
    if (!this.profileImageFile) {
      this.submitting.set(false);
      this.router.navigateByUrl(redirectTo);
      return;
    }
    this.usersService.uploadProfileImage(this.profileImageFile).subscribe({
      next: (user) => {
        this.authService.setCurrentUser(user);
        this.submitting.set(false);
        this.router.navigateByUrl(redirectTo);
      },
      error: () => {
        this.submitting.set(false);
        this.router.navigateByUrl(redirectTo);
      },
    });
  }

  private describeError(err: unknown, fallback: string): string {
    const message = (err as { error?: { message?: string } })?.error?.message;
    return message || fallback;
  }
}
