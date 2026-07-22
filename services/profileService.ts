import apiClient from './apiClient';
import type {
  ProfileResponse,
  SwitchActiveCountryPayload,
  UpdateProfilePayload,
  UserProfile,
} from '@/types/api';

/**
 * GET /api/v1/profile
 * Retourne le profil enrichi du user authentifie (avec country/series objets
 * et flag is_premium). Cote backend : ProfileController@show.
 */
export async function getProfile(): Promise<UserProfile> {
  const { data } = await apiClient.get<ProfileResponse>('/profile');
  return data.data;
}

/**
 * PATCH /api/v1/profile
 * Met a jour les champs editables du profil. Backend valide via
 * UpdateProfileRequest (champs en 'sometimes') :
 * - first_name, last_name (min:2, max:120)
 * - gender (M|F|Other)
 * - birth_date (before:today)
 * - series_id (doit appartenir au country_id du user, immuable cote profil)
 *
 * Le telephone et l'email ne sont PAS modifiables via cet endpoint.
 */
export async function updateProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
  const { data } = await apiClient.patch<ProfileResponse>('/profile', payload);
  return data.data;
}

/**
 * PATCH /api/v1/profile/active-country
 * Change le pays/série ACTIFS (celui dont le contenu est affiché), jamais le
 * pays/série d'ORIGINE (country/series du profil, figés à l'inscription).
 * Backend valide via SwitchActiveCountryRequest : active_series_id doit
 * appartenir à active_country_id.
 */
export async function switchActiveCountry(payload: SwitchActiveCountryPayload): Promise<UserProfile> {
  const { data } = await apiClient.patch<ProfileResponse>('/profile/active-country', payload);
  return data.data;
}
