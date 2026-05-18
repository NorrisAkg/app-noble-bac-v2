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

export interface Subject {
  id: number;
  name: string;
  slug: string;
  icon_slug: string;
  chapter_count: number;
}

export interface Chapter {
  id: number;
  title: string;
  description: string;
  order: number;
  file_count: number;
  free_file: {
    id: number;
    title: string;
  } | null;
}

export interface Lesson {
  id: number;
  title: string;
  order: number;
  duration_minutes: number;
  is_free: boolean;
  status: 'published' | 'draft';
  content?: string;
  chapter?: {
    id: number;
    title: string;
  };
}

export interface Book {
  id: number;
  title: string;
  author: string;
  description: string;
  page_count: number;
  is_free: boolean;
  status: string;
  cover_url: string | null;
  subject: {
    id: number;
    name: string;
  } | null;
}

/** Listing renvoyé par GET /courses/chapters/{id}/revision-sheets */
export interface RevisionSheetListItem {
  id: number;
  title: string;
  description: string | null;
  file_size_kb: number | null;
  is_free: boolean;
  status: 'published' | 'draft';
}

/** Détail renvoyé par GET /courses/revision-sheets/{id} */
export interface RevisionSheet extends RevisionSheetListItem {
  chapter: {
    id: number;
    title: string | null;
  };
  signed_url: string | null;
  signed_url_expires_at: string | null;
}

/** Listing renvoyé par GET /courses/chapters/{id}/chapter-videos */
export interface ChapterVideoListItem {
  id: number;
  title: string;
  description: string | null;
  youtube_video_id: string;
  duration_sec: number | null;
  thumbnail_url: string | null;
  is_free: boolean;
  status: 'published' | 'draft';
}

/** Détail renvoyé par GET /courses/chapter-videos/{id} */
export interface ChapterVideo extends ChapterVideoListItem {
  chapter: {
    id: number;
    title: string | null;
  };
}

// ─── API Envelope ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    current_page?: number;
    per_page?: number;
    total?: number;
    last_page?: number;
  };
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

export interface RequestPasswordResetPayload {
  /** E.164 format */
  phone: string;
}

export interface ResetPasswordPayload {
  /** E.164 format */
  phone: string;
  /** Firebase ID Token issued after on-device OTP success — must carry the same phone */
  id_token: string;
  /** New password, min 8 chars (backend enforces "confirmed" rule) */
  password: string;
  password_confirmation: string;
}

// ─── Auth Responses ───────────────────────────────────────────────────────────

/** Returned by /register and /verify-otp */
export type AuthUserResponse = ApiResponse<User>;

/** Returned by /login and /refresh */
export interface TokenData {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_at: string;
}
export type LoginResponse = ApiResponse<TokenData>;

// ─── Profile ──────────────────────────────────────────────────────────────────

/**
 * Shape retourne par GET /api/v1/profile (UserProfileResource).
 * Plus riche que `User` (utilise pour login/register) car la Resource
 * inclut country/series objets, avatar, gender, birth_date et is_premium.
 */
export interface UserProfile {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  gender: 'M' | 'F' | 'Other' | null;
  birth_date: string | null;
  avatar_url: string | null;
  country: {
    id: number;
    name: string;
    code: string;
    flag_emoji: string | null;
  };
  series: {
    id: number;
    label: string;
    code: string;
  };
  phone_verified_at: string | null;
  is_active: boolean;
  is_admin: boolean;
  is_premium: boolean;
}

/**
 * Payload PATCH /api/v1/profile (UpdateProfileRequest cote backend).
 * Tous les champs sont 'sometimes' : seuls les champs presents sont valides.
 */
export interface UpdateProfilePayload {
  first_name?: string;
  last_name?: string;
  gender?: 'M' | 'F' | 'Other';
  birth_date?: string;
  series_id?: number;
}

export type ProfileResponse = ApiResponse<UserProfile>;
