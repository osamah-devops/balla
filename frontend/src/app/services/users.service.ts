import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay, tap } from 'rxjs';
import { MfaStatusResponse, SetupMfaResponse } from '../models/auth.model';
import { UpdateProfileRequest, User, UserStatus } from '../models/user.model';

/**
 * The admin directory (getUsers/setStatus) still reads the mock JSON — the
 * backend only covers auth + the signed-in user's own profile so far.
 */
@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private users$?: Observable<User[]>;
  readonly users = signal<User[]>([]);

  getUsers(): Observable<User[]> {
    this.users$ ??= this.http.get<User[]>('/data/users.json').pipe(
      tap((users) => this.users.set(users)),
      shareReplay(1),
    );
    return this.users$;
  }

  getUserByEmail(email: string): User | undefined {
    return this.users().find((user) => user.email.toLowerCase() === email.toLowerCase());
  }

  setStatus(userId: string, status: UserStatus): void {
    this.users.update((users) => users.map((user) => (user.id === userId ? { ...user, status } : user)));
  }

  getMe(): Observable<User> {
    return this.http.get<User>('/api/users/me');
  }

  updateProfile(update: UpdateProfileRequest): Observable<User> {
    return this.http.put<User>('/api/users/me', update);
  }

  uploadProfileImage(file: File): Observable<User> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<User>('/api/users/me/profile-image', formData);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.post<void>('/api/users/me/change-password', { currentPassword, newPassword });
  }

  getMfaStatus(): Observable<MfaStatusResponse> {
    return this.http.get<MfaStatusResponse>('/api/users/me/mfa/status');
  }

  setupMfa(): Observable<SetupMfaResponse> {
    return this.http.post<SetupMfaResponse>('/api/users/me/mfa/setup', {});
  }

  verifyMfa(code: string): Observable<void> {
    return this.http.post<void>('/api/users/me/mfa/verify', { code });
  }

  disableMfa(): Observable<void> {
    return this.http.post<void>('/api/users/me/mfa/disable', {});
  }
}