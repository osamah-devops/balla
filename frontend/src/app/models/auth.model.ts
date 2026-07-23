import { User } from './user.model';

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  zipCode: string;
  state: string;
  storeName?: string;
}

export interface RegisterResponse {
  userId: string;
}

export interface ConfirmRegistrationRequest {
  email: string;
  code: string;
}

export interface ResendConfirmationCodeRequest {
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface LoginResponse {
  mfaRequired: boolean;
  mfaSession?: string;
  accessToken?: string;
  idToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  user?: User;
}

export interface MfaLoginRequest {
  email: string;
  session: string;
  code: string;
}

export interface SetupMfaResponse {
  secretCode: string;
  otpAuthUrl: string;
}

export interface VerifyMfaRequest {
  code: string;
}

export type LoginResult = { mfaRequired: true; email: string; session: string } | { mfaRequired: false; user: User };

export interface MfaStatusResponse {
  enabled: boolean;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}
