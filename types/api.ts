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

// ─── Catalog (annales BAC) ────────────────────────────────────────────────────

/**
 * GET /api/v1/catalog (filtre par country_id, series_id, subject_id, year).
 * Reponse paginee : data: ExamListItem[], meta: PaginationMeta.
 */
export interface ExamListItem {
  id: number;
  year: number;
  session: string | null;
  country: { id: number; name: string; iso_code: string };
  series: { id: number; name: string };
  subject: { id: number; name: string; icon_slug: string | null };
}

/**
 * GET /api/v1/catalog/{exam} : detail d'une epreuve + flags PDF dispo.
 */
export interface ExamDetail extends ExamListItem {
  has_exam_pdf: boolean;
  has_corrige_pdf: boolean;
}

/**
 * GET /api/v1/catalog/{exam}/videos : liste des videos commentees.
 */
export interface ExamVideoItem {
  id: number;
  title: string;
  youtube_video_id: string;
  duration_sec: number | null;
  thumbnail_url: string | null;
  order: number;
  status: string;
}

/**
 * POST /catalog/{exam}/signed-url et /catalog/{exam}/corrige/signed-url.
 * TTL 15min cote backend (Constants::SIGNED_URL_READ_TTL).
 */
export interface ExamSignedUrl {
  url: string;
  expires_at: string;
}

export interface ExamFilters {
  country_id?: number;
  series_id?: number;
  subject_id?: number;
  year?: number;
  page?: number;
  per_page?: number;
}

// ─── Module Offline (Mes téléchargements) ────────────────────────────────────

/**
 * Types polymorphes acceptes par POST /api/v1/me/downloads.
 * Doit etre en sync avec App\Domain\Common\Enums\DownloadableType cote backend.
 */
export type OfflineDownloadableType = 'correction' | 'revision_sheet' | 'book';

/**
 * Sous-objet retourne dans UserDownloadResource.downloadable selon le type.
 * Shape decoupe par le backend dans UserDownloadResource::resolveDownloadable().
 */
export type UserDownloadDownloadable =
  | { id: number; title: string; exam_id: number; page_count: number | null }
  | { id: number; title: string; chapter_id: number }
  | { id: number; title: string; author: string | null; page_count: number | null }
  | null;

/**
 * Shape retourne par GET /me/downloads et POST /me/downloads.
 * Les champs `signed_url` et `signed_url_expires_at` sont presents UNIQUEMENT
 * tant que l'URL est valide (when() cote backend).
 */
export interface UserDownload {
  id: number;
  downloadable_type: OfflineDownloadableType;
  downloadable_id: number;
  downloadable: UserDownloadDownloadable;
  file_size_kb: number;
  status: 'active' | 'inactive';
  is_active: boolean;
  downloaded_at: string;
  last_opened_at: string | null;
  expires_at: string | null;
  signed_url?: string;
  signed_url_expires_at?: string;
}

/**
 * Payload renvoye par GET /api/v1/me/downloads/quota (et inclus dans
 * meta.quota du GET /me/downloads).
 */
export interface OfflineQuotaStatus {
  used_kb: number;
  used_mb: number;
  remaining_kb: number;
  remaining_mb: number;
  max_kb: number;
  max_mb: number;
  window_days: number;
  usage_percentage: number;
}

/**
 * Payload de POST /api/v1/me/downloads.
 */
export interface DeclareDownloadPayload {
  downloadable_type: OfflineDownloadableType;
  downloadable_id: number;
}

/**
 * Erreur 422 retournee par DeclareDownloadAction quand le quota est insuffisant.
 * Le champ `errors` de ApiError contient une `suggestion` listant les downloads
 * a revoquer pour liberer assez d'espace.
 */
export interface QuotaExceededErrorPayload {
  kb_needed: number;
  kb_remaining: number;
  kb_to_free: number;
  download_ids: number[];
}
