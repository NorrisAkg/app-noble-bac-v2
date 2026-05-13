// ─── Domain Models ────────────────────────────────────────────────────────────

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  country_id: string;
  series_id: string;
  phone_verified_at: string | null;
  is_active: boolean;
}

export interface Country {
  id: string;
  name: string;
  iso_code: string;
  phone_code: string;
  currency_code: string;
  cinetpay_supported: boolean;
  series: Series[];
}

export interface Series {
  id: string;
  name: string;
}

// ─── API Envelope ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  errors: Record<string, string[]> | null;
}

// ─── Auth payloads ────────────────────────────────────────────────────────────

export interface RegisterPayload {
  first_name: string;
  last_name: string;
  /** E.164 format e.g. +22990123456 */
  phone: string;
  password: string;
  country_id: string;
  series_id: string;
}

export interface LoginPayload {
  /** E.164 format */
  phone: string;
  password: string;
}

export interface VerifyOtpPayload {
  /** E.164 format */
  phone: string;
  /** Firebase ID Token issued after on-device OTP success */
  id_token: string;
}

// ─── Auth Responses ───────────────────────────────────────────────────────────

/** Returned by /register and /verify-otp */
export type AuthUserResponse = ApiResponse<User>;

/** Returned by /login and /refresh */
export interface TokenData {
  user: User;
  token: string;
  expires_at: string;
}
export type LoginResponse = ApiResponse<TokenData>;
