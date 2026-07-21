import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class BlockedUsersService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  readonly blockedIds = signal<Set<string>>(new Set());

  refresh(): void {
    if (!this.authService.isAuthenticated()) {
      this.blockedIds.set(new Set());
      return;
    }
    this.http.get<string[]>('/api/users/me/blocked').subscribe((ids) => this.blockedIds.set(new Set(ids)));
  }

  isBlocked(userId: string): boolean {
    return this.blockedIds().has(userId);
  }

  block(userId: string): void {
    this.blockedIds.update((set) => new Set(set).add(userId));
    this.http.post<void>(`/api/users/me/blocked/${userId}`, {}).subscribe();
  }

  unblock(userId: string): void {
    this.blockedIds.update((set) => {
      const next = new Set(set);
      next.delete(userId);
      return next;
    });
    this.http.delete<void>(`/api/users/me/blocked/${userId}`).subscribe();
  }
}
