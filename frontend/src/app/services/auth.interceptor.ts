import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { switchMap } from 'rxjs';
import { AuthService } from './auth.service';

const API_PREFIX = '/api';
const AUTH_PREFIX = '/api/auth';

/** Attaches the Cognito access token to API calls; skips the auth endpoints themselves. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(API_PREFIX) || req.url.startsWith(AUTH_PREFIX)) {
    return next(req);
  }

  const authService = inject(AuthService);
  return authService.getValidAccessToken().pipe(
    switchMap((token) => {
      const authedReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
      return next(authedReq);
    }),
  );
};
