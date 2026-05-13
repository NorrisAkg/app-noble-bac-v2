import apiClient from './apiClient';
import type {
  RegisterPayload,
  LoginPayload,
  VerifyOtpPayload,
  AuthUserResponse,
  LoginResponse,
  ApiResponse,
} from '@/types/api';

/**
 * POST /api/v1/auth/register
 * Creates a new account. The user must then verify their phone via OTP.
 */
export async function register(payload: RegisterPayload): Promise<AuthUserResponse> {
  const { data } = await apiClient.post<AuthUserResponse>('/auth/register', payload);
  return data;
}

/**
 * POST /api/v1/auth/verify-otp
 * Verifies the Firebase ID Token produced after a successful on-device OTP step.
 * On success, marks phone_verified_at and returns the updated user.
 */
export async function verifyOtp(payload: VerifyOtpPayload): Promise<AuthUserResponse> {
  const { data } = await apiClient.post<AuthUserResponse>('/auth/verify-otp', payload);
  return data;
}

/**
 * POST /api/v1/auth/login
 * Authenticates with phone + password and returns a Sanctum token.
 */
export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', payload);
  return data;
}

/**
 * POST /api/v1/auth/logout  (requires Bearer token)
 * Revokes the current Sanctum token.
 */
export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}

/**
 * POST /api/v1/auth/refresh  (requires Bearer token)
 * Issues a new Sanctum token (rotates the old one).
 */
export async function refreshToken(): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/refresh');
  return data;
}
