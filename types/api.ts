// ─── Domain Models ────────────────────────────────────────────────────────────

export interface Advertisement {
  id: string;
  /** URL signée R2 ou URL externe ; null quand R2 n'est pas configuré (dev). */
  image_url: string | null;
  link_url: string;
  order: number;
}

/** Citation motivante renvoyée par GET /api/v1/quotes (rotation côté client). */
export interface Quote {
  id: string;
  text: string;
  author: string | null;
}

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  /** Identifiant principal depuis la refonte : toujours présent sur un compte récent. */
  email: string | null;
  /** Optionnel : un compte créé par email ou par Google n'en a pas. */
  phone: string | null;
  country_id: string;
  series_id: string;
  phone_verified_at: string | null;
  email_verified_at: string | null;
  is_active: boolean;
}

export interface Country {
  id: string;
  name: string;
  /** ISO-3166 alpha-2, ex: 'BJ', 'SN'. Aligné sur la colonne `code` de la table countries. */
  code: string;
  phone_code: string;
  flag_emoji: string | null;
  payment_enabled: boolean;
  is_active: boolean;
  series: Series[];
}

/**
 * Date du BAC pilotant le compte à rebours (GET /countries/{id}/exam-date).
 * Saisie par l'admin dans Filament, une par pays et par session.
 */
export interface ExamDateInfo {
  country_id: number;
  /** Année de la session, ex: 2027. */
  year: number;
  /** Format 'YYYY-MM-DD'. */
  exam_date: string;
  /**
   * Calculé par le serveur, jamais côté client : le fuseau de l'appareil ferait
   * diverger l'affichage d'un jour par rapport au back-office.
   */
  days_remaining: number;
}

export interface Series {
  id: string;
  /** Code interne (ex: 'A', 'C', 'D', 'S1'). */
  code: string;
  /** Libellé affiché (ex: 'Bac A', 'Sciences'). */
  label: string;
}

/**
 * Opérateur mobile money disponible pour un pays (Orange Money, MTN MoMo…).
 * Le mode FedaPay interne n'est jamais exposé : seul `id` est renvoyé au
 * backend lors de l'initiation du paiement.
 */
export interface Operator {
  id: number;
  /** Slug interne, ex: 'orange_ci'. */
  code: string;
  /** Libellé affiché, ex: 'Orange Money'. */
  name: string;
  /** Couleur de badge (hex), ex: '#FF6600'. */
  color: string | null;
  /** URL signée du logo, ou null. */
  logo_url: string | null;
}

export interface Subject {
  id: number;
  name: string;
  short_name?: string;
  slug: string;
  icon_slug: string;
  chapter_count: number;
}

/** Réponse de GET /courses/snapshot — matière avec chapitres et leçons imbriqués. */
export interface CourseSnapshotSubject extends Subject {
  color_hex?: string;
  chapters: Array<Chapter & { lessons: Lesson[] }>;
}

export interface Chapter {
  id: number;
  title: string;
  description: string;
  icon_slug?: string | null;
  order: number;
  file_count: number;
  free_file: {
    id: number;
    title: string;
  } | null;
  /** Nombre de questions de quiz publiées dans ce chapitre (peut être 0). */
  quiz_questions_count?: number;
  /** true si l'admin a explicitement publié le quiz de ce chapitre côté backend. */
  quiz_published?: boolean;
  /** true si le chapitre possède une vidéo publiée. */
  has_video?: boolean;
  /** true si le chapitre possède une fiche de révision publiée. */
  has_revision_sheet?: boolean;
}

export interface Lesson {
  id: number;
  title: string;
  order: number;
  duration_minutes: number;
  is_free: boolean;
  status: 'published' | 'draft';
  /** Signed R2 URL (15 min TTL) for the standalone HTML file. Null when no HTML uploaded yet. */
  html_url: string | null;
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
  video_provider: 'youtube' | 'vimeo';
  video_id: string;
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

// ─── Compatibilité du client ──────────────────────────────────────────────────

/** Réponse de GET /api/v1/app-version. */
export interface AppVersionInfo {
  platform: string;
  /** Version du binaire telle qu'envoyée par le client, ou null si omise. */
  current: string | null;
  min_supported: string;
  latest: string;
  store_url: string;
  /** true ⇒ l'app doit bloquer l'utilisateur sur l'écran de mise à jour. */
  force_update: boolean;
  update_available: boolean;
}

// ─── Auth payloads ────────────────────────────────────────────────────────────

export interface RegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  /** Au moins 8 caractères. Le backend borne aussi à 72 octets (limite bcrypt). */
  password: string;
  password_confirmation: string;
  /** Optionnel depuis la refonte — E.164, ex. +22790123456. */
  phone?: string;
  country_id: string;
  /**
   * Optionnel : le backend auto-affecte la 1re série active du pays
   * si non fourni. L'utilisateur la choisit/corrige via /setup.
   */
  series_id?: string;
}

export interface LoginPayload {
  /**
   * Email ou numéro E.164 — le backend discrimine sur la présence d'un `@`.
   * Aucune validation de format côté client : un identifiant inconnu doit
   * produire un 401 générique, pas une erreur de saisie qui révélerait
   * quel format est attendu.
   */
  identifier: string;
  password: string;
}

export interface ChangePasswordPayload {
  /** Peut être un PIN à 4 chiffres : c'est l'ancien mot de passe. */
  current_password: string;
  password: string;
  password_confirmation: string;
}

export interface VerifyEmailPayload {
  email: string;
  /** Code à 6 chiffres reçu par email. */
  code: string;
}

export interface ResendEmailCodePayload {
  email: string;
}

export interface GoogleSignInPayload {
  /** id_token obtenu du SDK natif Google, vérifié côté backend. */
  id_token: string;
  /**
   * Requis uniquement à la création du compte. Un utilisateur déjà inscrit
   * n'a aucun pays à fournir ; le backend renvoie une erreur de validation
   * sur ce champ s'il doit créer et ne l'a pas reçu.
   */
  country_id?: string;
}

export interface VerifyOtpPayload {
  /** E.164 format */
  phone: string;
  /** 6-digit OTP code received on WhatsApp via Twilio Verify */
  code: string;
}

export interface SendOtpPayload {
  /** E.164 format */
  phone: string;
}

export interface RequestPasswordResetPayload {
  /**
   * Email ou numéro E.164. Le canal d'envoi suit l'identifiant saisi, pas les
   * données du compte : qui tape son numéro reçoit un SMS, même si son compte
   * porte une adresse email.
   */
  identifier: string;
}

export interface ResetPasswordPayload {
  /** Le même identifiant qu'à la demande — il détermine le canal de vérification. */
  identifier: string;
  /** Code à 6 chiffres reçu par email ou par WhatsApp/SMS. */
  code: string;
  /** Au moins 8 caractères — le reset applique la règle moderne, contrairement au login. */
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
  /**
   * Compte historique dont le mot de passe fait moins de8 caractères.
   * Renseigné par /auth/login uniquement — c'est le seul endpoint où le
   * backend voit le mot de passe en clair. Vaut false partout ailleurs.
   */
  password_upgrade_required: boolean;
  /**
   * Vrai si le compte vient d'être créé (ex: nouvelle inscription Google),
   * permettant de guider l'utilisateur vers le choix de sa série.
   */
  is_new_user?: boolean;
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
  /** Pays d'origine, choisi à l'inscription. Ne change jamais. */
  country: {
    id: number;
    name: string;
    code: string;
    /** Indicatif avec le `+` (ex: "+229") — sert à recomposer un numéro saisi en local. */
    phone_code: string;
    flag_emoji: string | null;
  };
  /** Série d'origine, liée au pays d'origine. Ne change jamais. */
  series: {
    id: number;
    label: string;
    code: string;
  };
  /** Pays actif : celui dont le contenu est affiché. Modifiable via switchActiveCountry(). */
  active_country: {
    id: number;
    name: string;
    code: string;
    flag_emoji: string | null;
  };
  /** Série active, liée au pays actif. Modifiable via switchActiveCountry(). */
  active_series: {
    id: number;
    label: string;
    code: string;
  };
  phone_verified_at: string | null;
  /**
   * Le compte est rattaché à Google. Un compte créé par Google porte un mot de
   * passe aléatoire que son titulaire ne connaît pas : l'écran de suppression
   * doit alors proposer la ré-authentification Google, pas un champ password.
   */
  google_linked: boolean;
  is_active: boolean;
  is_admin: boolean;
  is_premium: boolean;
}

/**
 * Payload PATCH /api/v1/profile (UpdateProfileRequest cote backend).
 * Tous les champs sont 'sometimes' : seuls les champs presents sont valides.
 * Modifie le pays/série D'ORIGINE — n'est plus appelé par le flux de
 * changement de pays actif (voir SwitchActiveCountryPayload).
 */
export interface UpdateProfilePayload {
  first_name?: string;
  last_name?: string;
  gender?: 'M' | 'F' | 'Other';
  birth_date?: string;
  series_id?: number;
}

/**
 * Payload PATCH /api/v1/profile/active-country (SwitchActiveCountryRequest
 * cote backend). Change le pays/série ACTIFS, jamais l'origine.
 */
export interface SwitchActiveCountryPayload {
  active_country_id: number;
  active_series_id: number;
}

export type ProfileResponse = ApiResponse<UserProfile>;

// ─── Suppression de compte ────────────────────────────────────────────────────

/**
 * Motifs proposés avant la suppression. Contrat figé avec l'enum backend
 * `App\Domain\Profile\Enums\AccountDeletionReason` : toute valeur ajoutée
 * ici doit l'être des deux côtés dans le même commit.
 */
export type AccountDeletionReason =
  | 'no_longer_using'
  | 'found_alternative'
  | 'premium_not_interesting'
  | 'privacy_concerns'
  | 'other';

export interface DeleteAccountPayload {
  reason: AccountDeletionReason;
  /** Doit valoir exactement « SUPPRIMER ». */
  confirmation: string;
  /** L'un des deux est requis : mot de passe, ou id_token pour un compte Google. */
  password?: string;
  google_id_token?: string;
  feedback?: string;
}

export interface AccountDeletionData {
  deletion_requested_at: string;
  /** Date de la purge définitive — à afficher à l'utilisateur. */
  purge_at: string;
  grace_days: number;
}

export type DeleteAccountResponse = ApiResponse<AccountDeletionData>;

export interface CancelAccountDeletionPayload {
  identifier?: string;
  password?: string;
  google_id_token?: string;
}

/**
 * Shape renvoyée par GET /api/v1/me/stats (MeStatsResource côté backend).
 * Stats agrégées calculées sur quiz_sessions completed et user_downloads.
 */
export interface MeStats {
  quiz_count: number;
  average_score_pct: number;
  exams_consulted: number;
}

/**
 * Shape renvoyée par GET /api/v1/me/last-read (LastReadResource côté backend,
 * null quand l'utilisateur n'a encore rien ouvert). Alimente la carte
 * « Reprendre » de l'accueil.
 */
export interface LastRead {
  readable_type: string;
  readable_id: number;
  title: string | null;
  subject_name: string | null;
  page_current: number | null;
  page_total: number | null;
  progress_pct: number | null;
  last_opened_at: string | null;
}

// ─── Catalog (annales BAC) ────────────────────────────────────────────────────

/**
 * GET /api/v1/catalog (filtre par country_id, series_id, subject_id, year).
 * Reponse paginee : data: ExamListItem[], meta: PaginationMeta.
 */
export interface ExamListItem {
  id: number;
  year: { id: number; value: number };
  session: string | null;
  country: { id: number; name: string; iso_code: string };
  series: { id: number; code: string };
  subject: { id: number; name: string; icon_slug: string | null };
  is_free?: boolean;
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
  is_free: boolean;
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

// ─── Abonnements / Plans / Transactions ──────────────────────────────────────

/**
 * Shape retourne par GET /api/v1/subscriptions/plans
 * (SubscriptionPlanResource cote backend). duration_days = 7/30/90 selon plan MVP.
 */
export interface SubscriptionPlan {
  id: number;
  code: string;
  label: string;
  duration_days: number;
  price_fcfa: number;
  currency: string;
}

/**
 * Statuts possibles d'un abonnement (SubscriptionStatus enum cote backend).
 */
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';

/**
 * Shape retourne par GET /api/v1/subscriptions/active
 * (peut etre null si aucun abonnement actif).
 */
export interface ActiveSubscription {
  id: number;
  status: SubscriptionStatus;
  country_id: number;
  series_id: number;
  plan?: SubscriptionPlan;
  started_at: string | null;
  expires_at: string | null;
}

/**
 * Statuts possibles d'une transaction (TransactionStatus enum backend).
 */
export type TransactionStatus = 'pending' | 'confirmed' | 'failed' | 'expired';

/**
 * Shape retourne par GET /api/v1/subscriptions/transactions
 * (TransactionResource — liste paginee).
 */
export interface PaymentTransaction {
  id: number;
  internal_reference: string;
  gateway_transaction_id: string | null;
  status: TransactionStatus;
  amount_fcfa: number;
  currency: string;
  plan?: SubscriptionPlan;
  webhook_received_at: string | null;
  confirmed_at: string | null;
  created_at: string;
}
