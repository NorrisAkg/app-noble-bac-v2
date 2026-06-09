import apiClient from './apiClient';
import type {
  RegisterPayload,
  LoginPayload,
  VerifyOtpPayload,
  RequestPasswordResetPayload,
  ResetPasswordPayload,
  SendOtpPayload,
  AuthUserResponse,
  LoginResponse,
  ApiResponse,
} from '@/types/api';

/**
 * POST /api/v1/auth/register
 * Creates a new account and triggers a WhatsApp OTP via Twilio Verify.
 * The user must then verify their phone via /auth/verify-otp.
 */
export async function register(payload: RegisterPayload): Promise<AuthUserResponse> {
  const { data } = await apiClient.post<AuthUserResponse>('/auth/register', payload);
  return data;
}

/**
 * POST /api/v1/auth/verify-otp
 * Submits the 6-digit OTP code to the backend. Twilio Verify validates it.
 * On success, marks phone_verified_at and issues access + refresh tokens (auto-login).
 */
export async function verifyOtp(payload: VerifyOtpPayload): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/verify-otp', payload);
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

/**
 * POST /api/v1/auth/password/request-reset
 * Confirms the phone is registered and dispatches a WhatsApp OTP via Twilio Verify.
 * Always responds 200 to avoid phone-number enumeration.
 */
export async function requestPasswordReset(
  payload: RequestPasswordResetPayload,
): Promise<ApiResponse<null>> {
  const { data } = await apiClient.post<ApiResponse<null>>('/auth/password/request-reset', payload);
  return data;
}

/**
 * POST /api/v1/auth/password/reset
 * Resets the password after Twilio Verify validates the 6-digit OTP code.
 * Backend revokes all existing Sanctum tokens on success.
 */
export async function resetPassword(payload: ResetPasswordPayload): Promise<ApiResponse<null>> {
  const { data } = await apiClient.post<ApiResponse<null>>('/auth/password/reset', payload);
  return data;
}

/**
 * POST /api/v1/auth/send-otp
 * Requests a new WhatsApp OTP dispatch for the given phone.
 * Used by the resend button on the verify screen.
 */
export async function sendOtp(payload: SendOtpPayload): Promise<ApiResponse<null>> {
  const { data } = await apiClient.post<ApiResponse<null>>('/auth/send-otp', payload);
  return data;
}
