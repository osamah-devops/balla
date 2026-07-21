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

export interface LoginResponse extends AuthTokens {
  user: User;
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
