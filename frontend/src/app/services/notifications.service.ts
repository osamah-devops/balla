import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import * as signalR from '@microsoft/signalr';
import { AuthService } from './auth.service';
import { AppNotification } from '../models/notification.model';

const MAX_NOTIFICATIONS = 50;

/**
 * Wraps the SignalR connection to the notifications hub (both buyers and sellers use
 * it) and layers it on top of the persisted notification list, so a missed live push
 * still shows up next time the user opens the app.
 */
@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private connection?: signalR.HubConnection;

  readonly notifications = signal<AppNotification[]>([]);
  readonly unreadCount = computed(() => this.notifications().filter((n) => !n.read).length);

  async connect(): Promise<void> {
    if (this.connection) {
      return;
    }

    try {
      const persisted = await firstValueFrom(this.http.get<AppNotification[]>('/api/notifications'));
      this.notifications.set(persisted);
    } catch {
      // Non-fatal: the live connection below still works even if the initial fetch fails.
    }

    const connection = new signalR.HubConnectionBuilder()
      .withUrl('/api/hubs/notifications', {
        accessTokenFactory: async () => (await firstValueFrom(this.authService.getValidAccessToken())) ?? '',
      })
      .withAutomaticReconnect()
      .build();

    connection.on('notification', (payload: AppNotification) => {
      this.notifications.update((list) => [payload, ...list].slice(0, MAX_NOTIFICATIONS));
    });

    this.connection = connection;

    try {
      await connection.start();
    } catch {
      this.connection = undefined;
    }
  }

  async disconnect(): Promise<void> {
    await this.connection?.stop();
    this.connection = undefined;
    this.notifications.set([]);
  }

  markRead(notificationId: string): void {
    this.notifications.update((list) => list.map((n) => (n.id === notificationId ? { ...n, read: true } : n)));
    this.http.post<void>(`/api/notifications/${notificationId}/read`, {}).subscribe();
  }

  markAllRead(): void {
    this.notifications.update((list) => list.map((n) => ({ ...n, read: true })));
    this.http.post<void>('/api/notifications/read-all', {}).subscribe();
  }
}
