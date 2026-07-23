import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

const API_PREFIX = '/api';
const AUTH_PREFIX = '/api/auth';

function attach(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  return token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
}

/** Attaches the Cognito access token to API calls; skips the auth endpoints themselves. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(API_PREFIX) || req.url.startsWith(AUTH_PREFIX)) {
    return next(req);
  }

  const authService = inject(AuthService);
  return authService.getValidAccessToken().pipe(
    switchMap((token) => next(attach(req, token))),
    catchError((error: unknown) => {
      // The proactive expiry check above can still miss it (clock drift, a concurrent
      // tab having already rotated the token) — force one refresh-and-retry before
      // giving up, rather than surfacing a session-expired error the user didn't earn.
      if (error instanceof HttpErrorResponse && error.status === 401) {
        return authService.forceRefresh().pipe(
          switchMap((token) => (token ? next(attach(req, token)) : throwError(() => error))),
        );
      }
      return throwError(() => error);
    }),
  );
};
