import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { provideIcons, NgIcon } from '@ng-icons/core';
import { faSolidCamera, faSolidFloppyDisk, faSolidLocationDot, faSolidUser } from '@ng-icons/font-awesome/solid';
import { AuthService } from '../../services/auth.service';
import { UsersService } from '../../services/users.service';
import { US_STATES } from '../../data/us-states';

const ZIP_PATTERN = /^\d{5}(-\d{4})?$/;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, NgIcon],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
  providers: [provideIcons({ faSolidCamera, faSolidFloppyDisk, faSolidLocationDot, faSolidUser })],
})
export class Profile {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly usersService = inject(UsersService);

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
