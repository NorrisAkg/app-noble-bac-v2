import apiClient from './apiClient';
import type {
  RegisterPayload,
  LoginPayload,
  VerifyOtpPayload,
  VerifyEmailPayload,
  ResendEmailCodePayload,
  GoogleSignInPayload,
  ChangePasswordPayload,
  RequestPasswordResetPayload,
  ResetPasswordPayload,
  SendOtpPayload,
  AuthUserResponse,
  LoginResponse,
  ApiResponse,
} from '@/types/api';

/**
 * POST /api/v1/auth/register
 * Crée un compte non vérifié et envoie un code à 6 chiffres par email.
 * L'utilisateur le soumet ensuite à /auth/email/verify.
 */
export async function register(payload: RegisterPayload): Promise<AuthUserResponse> {
  const { data } = await apiClient.post<AuthUserResponse>('/auth/register', payload);
  return data;
}

/**
 * POST /api/v1/auth/email/verify
 * Valide le code reçu par email. En cas de succès, marque email_verified_at et
 * émet les tokens : la vérification vaut connexion.
 */
export async function verifyEmail(payload: VerifyEmailPayload): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/email/verify', payload);
  return data;
}

/**
 * POST /api/v1/auth/email/resend
 * Renvoie un code de vérification. Répond 200 que l'adresse existe ou non,
 * pour ne pas transformer l'endpoint en oracle d'énumération des comptes.
 */
export async function resendEmailCode(
  payload: ResendEmailCodePayload,
): Promise<ApiResponse<null>> {
  const { data } = await apiClient.post<ApiResponse<null>>('/auth/email/resend', payload);
  return data;
}

/**
 * POST /api/v1/auth/verify-otp
 * Vérification par OTP téléphone. Conservé pour les comptes créés avant la
 * refonte, qui n'ont pas d'email.
 */
export async function verifyOtp(payload: VerifyOtpPayload): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/verify-otp', payload);
  return data;
}

/**
 * POST /api/v1/auth/login
 * Authentifie un identifiant (email ou téléphone) + mot de passe.
 */
export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', payload);
  return data;
}

/**
 * POST /api/v1/auth/google
 * Connexion ET inscription : le backend crée le compte s'il n'existe pas,
 * ou rattache le compte existant portant la même adresse.
 */
export async function googleSignIn(payload: GoogleSignInPayload): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/google', payload);
  return data;
}

/**
 * POST /api/v1/auth/password/change  (requiert un Bearer token)
 * Change le mot de passe et renvoie un nouveau couple de tokens : le backend
 * révoque tous les credentials existants, y compris celui de l'appelant.
 */
export async function changePassword(payload: ChangePasswordPayload): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/password/change', payload);
  return data;
}

/**
 * POST /api/v1/auth/logout  (requiert un Bearer token)
 * Révoque le token Sanctum courant.
 */
export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}

/**
 * POST /api/v1/auth/password/request-reset
 * Envoie un code sur le canal correspondant à l'identifiant saisi.
 * Répond toujours 200 pour éviter l'énumération des comptes.
 */
export async function requestPasswordReset(
  payload: RequestPasswordResetPayload,
): Promise<ApiResponse<null>> {
  const { data } = await apiClient.post<ApiResponse<null>>('/auth/password/request-reset', payload);
  return data;
}

/**
 * POST /api/v1/auth/password/reset
 * Réinitialise le mot de passe après validation du code. Le backend révoque
 * tous les tokens existants en cas de succès.
 */
export async function resetPassword(payload: ResetPasswordPayload): Promise<ApiResponse<null>> {
  const { data } = await apiClient.post<ApiResponse<null>>('/auth/password/reset', payload);
  return data;
}

/**
 * POST /api/v1/auth/send-otp
 * Renvoie un OTP téléphone. Utilisé par les comptes historiques uniquement.
 */
export async function sendOtp(payload: SendOtpPayload): Promise<ApiResponse<null>> {
  const { data } = await apiClient.post<ApiResponse<null>>('/auth/send-otp', payload);
  return data;
}
