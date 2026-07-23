import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, finalize, map, of, shareReplay, switchMap, tap } from 'rxjs';
import { User } from '../models/user.model';
import {
  AuthTokens,
  ConfirmRegistrationRequest,
  ForgotPasswordRequest,
  LoginResponse,
  LoginResult,
  RegisterRequest,
  RegisterResponse,
  ResendConfirmationCodeRequest,
  ResetPasswordRequest,
} from '../models/auth.model';

const STORAGE_KEY = 'balla.auth.session';
const API_BASE = '/api/auth';
/** Refresh a bit before actual expiry so in-flight requests don't race the clock. */
const EXPIRY_SAFETY_MARGIN_MS = 10_000;

interface StoredSession {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  expiresAt: number;
}

/**
 * Auth lives in Cognito behind the API; this service never sees passwords
 * after they're POSTed. Tokens are cached in localStorage so a page reload
 * doesn't require signing in again.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  readonly currentUser = signal<User | null>(null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  private session: StoredSession | null = null;
  /** Chosen at login (by "remember me") or restore (wherever the session was found); refreshed tokens follow it. */
  private activeStorage: Storage = localStorage;

  register(request: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${API_BASE}/register`, request);
  }

  confirmRegistration(request: ConfirmRegistrationRequest): Observable<void> {
    return this.http.post<void>(`${API_BASE}/confirm`, request);
  }

  resendConfirmationCode(request: ResendConfirmationCodeRequest): Observable<void> {
    return this.http.post<void>(`${API_BASE}/resend-code`, request);
  }

  /** Resolves to a completed login, or an MFA challenge to hand off to completeMfaLogin(). */
  login(email: string, password: string, rememberMe = true): Observable<LoginResult> {
    this.activeStorage = rememberMe ? localStorage : sessionStorage;
    return this.http
      .post<LoginResponse>(`${API_BASE}/login`, { email, password })
      .pipe(map((response) => this.handleLoginResponse(response, email)));
  }

  /** Completes a login that was interrupted by an MFA challenge from login(). */
  completeMfaLogin(email: string, session: string, code: string): Observable<User> {
    return this.http.post<LoginResponse>(`${API_BASE}/mfa/login`, { email, session, code }).pipe(
      map((response) => {
        const result = this.handleLoginResponse(response, email);
        if (result.mfaRequired) {
          throw new Error('Unexpected MFA challenge after completing MFA login.');
        }
        return result.user;
      }),
    );
  }

  private handleLoginResponse(response: LoginResponse, email: string): LoginResult {
    if (response.mfaRequired) {
      return { mfaRequired: true, email, session: response.mfaSession! };
    }
    this.applyTokens({
      accessToken: response.accessToken!,
      idToken: response.idToken!,
      refreshToken: response.refreshToken,
      expiresIn: response.expiresIn!,
    });
    this.currentUser.set(response.user!);
    return { mfaRequired: false, user: response.user! };
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<void> {
    return this.http.post<void>(`${API_BASE}/forgot-password`, request);
  }

  resetPassword(request: ResetPasswordRequest): Observable<void> {
    return this.http.post<void>(`${API_BASE}/reset-password`, request);
  }

  logout(): void {
    this.session = null;
    this.currentUser.set(null);
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
  }

  hasRole(...roles: User['role'][]): boolean {
    const user = this.currentUser();
    return !!user && roles.includes(user.role);
  }

  /** Lets pages (e.g. after a profile update) push a fresher user without a round trip. */
  setCurrentUser(user: User): void {
    this.currentUser.set(user);
  }

  /** Used by the HTTP interceptor; refreshes first if the cached token is stale. */
  getValidAccessToken(): Observable<string | null> {
    if (!this.session) {
      return of(null);
    }
    if (Date.now() < this.session.expiresAt - EXPIRY_SAFETY_MARGIN_MS) {
      return of(this.session.accessToken);
    }
    return this.refresh();
  }

  /** Bypasses the expiry check for an immediate refresh — the interceptor's fallback
   * when a request 401s despite the proactive check above passing (clock drift,
   * a concurrent tab having already rotated the token, etc.). */
  forceRefresh(): Observable<string | null> {
    return this.refresh();
  }

  /** Restores the session from whichever storage tier has it; call once on app start. */
  restoreSession(): Observable<User | null> {
    const fromLocal = localStorage.getItem(STORAGE_KEY);
    this.activeStorage = fromLocal ? localStorage : sessionStorage;
    const raw = fromLocal ?? sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return of(null);
    }
    try {
      this.session = JSON.parse(raw) as StoredSession;
    } catch {
      this.activeStorage.removeItem(STORAGE_KEY);
      return of(null);
    }

    return this.getValidAccessToken().pipe(
      switchMap((token) => {
        if (!token) {
          return of(null);
        }
        return this.http.get<User>('/api/users/me').pipe(
          tap((user) => this.currentUser.set(user)),
          catchError(() => {
            this.logout();
            return of(null);
          }),
        );
      }),
    );
  }

  private refreshInFlight: Observable<string | null> | null = null;

  /** Concurrent callers (e.g. several requests hitting expiry at once) share one
   * in-flight refresh instead of each firing their own /auth/refresh call. */
  private refresh(): Observable<string | null> {
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }
    if (!this.session?.refreshToken) {
      this.logout();
      return of(null);
    }
    const request$ = this.http.post<AuthTokens>(`${API_BASE}/refresh`, { refreshToken: this.session.refreshToken }).pipe(
      map((tokens) => {
        this.applyTokens(tokens);
        return tokens.accessToken;
      }),
      catchError(() => {
        this.logout();
        return of(null);
      }),
      finalize(() => (this.refreshInFlight = null)),
      shareReplay(1),
    );
    this.refreshInFlight = request$;
    return request$;
  }

  private applyTokens(tokens: AuthTokens): void {
    this.session = {
      accessToken: tokens.accessToken,
      idToken: tokens.idToken,
      refreshToken: tokens.refreshToken ?? this.session?.refreshToken,
      expiresAt: Date.now() + tokens.expiresIn * 1000,
    };
    this.activeStorage.setItem(STORAGE_KEY, JSON.stringify(this.session));
  }
}
