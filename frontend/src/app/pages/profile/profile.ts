import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { provideIcons, NgIcon } from '@ng-icons/core';
import { faSolidBan, faSolidCamera, faSolidFloppyDisk, faSolidLocationDot, faSolidLock, faSolidShieldHalved, faSolidUser } from '@ng-icons/font-awesome/solid';
import qrcode from 'qrcode-generator';
import { AuthService } from '../../services/auth.service';
import { UsersService } from '../../services/users.service';
import { BlockedUsersService } from '../../services/blocked-users.service';
import { US_STATES } from '../../data/us-states';
import { SetupMfaResponse } from '../../models/auth.model';

const ZIP_PATTERN = /^\d{5}(-\d{4})?$/;
// Mirrors the Cognito user pool password policy in infrastructure/auth.tf.
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get('newPassword')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password && confirmPassword && password !== confirmPassword ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, NgIcon],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
  providers: [provideIcons({ faSolidBan, faSolidCamera, faSolidFloppyDisk, faSolidLocationDot, faSolidLock, faSolidShieldHalved, faSolidUser })],
})
export class Profile {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly usersService = inject(UsersService);
  readonly blockedUsersService = inject(BlockedUsersService);

  readonly currentUser = this.authService.currentUser;
  readonly states = US_STATES;
  readonly saving = signal(false);
  readonly uploadingImage = signal(false);
  readonly successMessage = signal('');
  readonly errorMessage = signal('');

  readonly form = this.fb.nonNullable.group({
    name: [this.currentUser()?.name ?? '', [Validators.required, Validators.minLength(2)]],
    zipCode: [this.currentUser()?.zipCode ?? '', [Validators.required, Validators.pattern(ZIP_PATTERN)]],
    state: [this.currentUser()?.state ?? '', [Validators.required]],
  });

  readonly changingPassword = signal(false);
  readonly passwordSuccess = signal('');
  readonly passwordError = signal('');
  readonly passwordForm = this.fb.nonNullable.group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatch },
  );

  /** Loaded from the backend on init; setup/disable actions update it locally afterward. */
  readonly mfaEnabled = signal(false);
  readonly mfaStatusLoaded = signal(false);
  readonly mfaSetup = signal<SetupMfaResponse | null>(null);
  readonly mfaQrCodeDataUrl = signal<string | null>(null);
  readonly mfaBusy = signal(false);
  readonly mfaSuccess = signal('');
  readonly mfaError = signal('');
  readonly mfaCodeForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
  });

  constructor() {
    this.blockedUsersService.refresh();
    this.loadMfaStatus();
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    this.changingPassword.set(true);
    this.passwordSuccess.set('');
    this.passwordError.set('');
    const { currentPassword, newPassword } = this.passwordForm.getRawValue();
    this.usersService.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.changingPassword.set(false);
        this.passwordSuccess.set('Password updated.');
        this.passwordForm.reset({ currentPassword: '', newPassword: '', confirmPassword: '' });
      },
      error: (err) => {
        this.changingPassword.set(false);
        this.passwordError.set((err as { error?: { message?: string } })?.error?.message || 'Could not change your password.');
      },
    });
  }

  private loadMfaStatus(): void {
    this.usersService.getMfaStatus().subscribe({
      next: (status) => {
        this.mfaEnabled.set(status.enabled);
        this.mfaStatusLoaded.set(true);
      },
      error: () => this.mfaStatusLoaded.set(true),
    });
  }

  startMfaSetup(): void {
    this.mfaBusy.set(true);
    this.mfaSuccess.set('');
    this.mfaError.set('');
    this.usersService.setupMfa().subscribe({
      next: (setup) => {
        this.mfaBusy.set(false);
        this.mfaSetup.set(setup);
        const qr = qrcode(0, 'M');
        qr.addData(setup.otpAuthUrl);
        qr.make();
        this.mfaQrCodeDataUrl.set(qr.createDataURL(6, 8));
      },
      error: () => {
        this.mfaBusy.set(false);
        this.mfaError.set('Could not start two-factor setup. Please try again.');
      },
    });
  }

  cancelMfaSetup(): void {
    this.mfaSetup.set(null);
    this.mfaQrCodeDataUrl.set(null);
    this.mfaCodeForm.reset({ code: '' });
    this.mfaError.set('');
  }

  verifyMfaSetup(): void {
    if (this.mfaCodeForm.invalid) {
      this.mfaCodeForm.markAllAsTouched();
      return;
    }
    const { code } = this.mfaCodeForm.getRawValue();
    this.mfaBusy.set(true);
    this.mfaError.set('');
    this.usersService.verifyMfa(code).subscribe({
      next: () => {
        this.mfaBusy.set(false);
        this.mfaEnabled.set(true);
        this.mfaSetup.set(null);
        this.mfaQrCodeDataUrl.set(null);
        this.mfaCodeForm.reset({ code: '' });
        this.mfaSuccess.set('Two-factor authentication is enabled.');
      },
      error: (err) => {
        this.mfaBusy.set(false);
        this.mfaError.set((err as { error?: { message?: string } })?.error?.message || 'That code is invalid.');
      },
    });
  }

  disableMfa(): void {
    this.mfaBusy.set(true);
    this.mfaSuccess.set('');
    this.mfaError.set('');
    this.usersService.disableMfa().subscribe({
      next: () => {
        this.mfaBusy.set(false);
        this.mfaEnabled.set(false);
        this.mfaSuccess.set('Two-factor authentication is disabled.');
      },
      error: () => {
        this.mfaBusy.set(false);
        this.mfaError.set('Could not disable two-factor authentication. Please try again.');
      },
    });
  }

  unblock(userId: string): void {
    this.blockedUsersService.unblock(userId);
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
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
    this.uploadingImage.set(true);
    this.usersService.uploadProfileImage(file).subscribe({
      next: (user) => {
        this.authService.setCurrentUser(user);
        this.uploadingImage.set(false);
      },
      error: () => {
        this.uploadingImage.set(false);
        this.errorMessage.set('Could not upload your photo. Please try again.');
      },
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');
    this.usersService.updateProfile(this.form.getRawValue()).subscribe({
      next: (user) => {
        this.authService.setCurrentUser(user);
        this.saving.set(false);
        this.successMessage.set('Profile updated.');
      },
      error: () => {
        this.saving.set(false);
        this.errorMessage.set('Could not save your changes. Please try again.');
      },
    });
  }
}
