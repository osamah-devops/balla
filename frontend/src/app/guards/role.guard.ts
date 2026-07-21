import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserRole } from '../models/user.model';
import { AuthService } from '../services/auth.service';

export function roleGuard(...allowedRoles: UserRole[]): CanActivateFn {
  return (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const user = auth.currentUser();

    if (!user) {
      return router.createUrlTree(['/login'], { queryParams: { redirectTo: state.url } });
    }
    if (!allowedRoles.includes(user.role)) {
      return router.createUrlTree(['/home']);
    }
    return true;
  };
}