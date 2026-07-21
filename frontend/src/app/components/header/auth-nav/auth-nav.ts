import { Component, EventEmitter, Input, Output, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IsActiveMatchOptions, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { NotificationsService } from '../../../services/notifications.service';


@Component({
  selector: 'app-auth-nav',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './auth-nav.html',
  styleUrl: './auth-nav.css',
})
export class AuthNav {
  @Input() mobile = false;
  @Input() currentPath = '';
  @Output() linkClick = new EventEmitter<void>();
  private readonly authService = inject(AuthService);
  private readonly notificationsService = inject(NotificationsService);

  readonly currentUser = this.authService.currentUser;
  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly unreadCount = this.notificationsService.unreadCount;

  get dashboardLink(): string | null {
    switch (this.currentUser()?.role) {
      case 'admin':
        return '/admin-dashboard';
      case 'seller':
        return '/seller-dashboard';
      default:
        return null;
    }
  }

  private readonly exactMatch: IsActiveMatchOptions = {
    paths: 'exact',
    queryParams: 'ignored',
    fragment: 'ignored',
    matrixParams: 'ignored',
  };

  constructor(private router: Router) {
    // The header is present app-wide while signed in, so this is the natural place to
    // own the notifications connection lifecycle (rather than a single dashboard page).
    effect(() => {
      if (this.isAuthenticated()) {
        this.notificationsService.connect();
      } else {
        this.notificationsService.disconnect();
      }
    });
  }

  get isLoginPage(): boolean {
    return this.currentPath
      ? this.normalizePath(this.currentPath) === '/login'
      : this.router.isActive('/login', this.exactMatch);
  }

  get isRegisterPage(): boolean {
    return this.currentPath
      ? this.normalizePath(this.currentPath) === '/register'
      : this.router.isActive('/register', this.exactMatch);
  }

  private normalizePath(url: string): string {
    return url.split('?')[0].split('#')[0];
  }

  logout() {
    this.authService.logout();
    this.linkClick.emit();
  }
}
