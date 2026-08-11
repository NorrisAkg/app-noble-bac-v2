import apiClient from './apiClient';
import type {
  AccountDeletionData,
  CancelAccountDeletionPayload,
  DeleteAccountPayload,
  DeleteAccountResponse,
  LoginResponse,
  TokenData,
} from '@/types/api';

/**
 * DELETE /api/v1/me/account  (requiert un Bearer token)
 *
 * Enregistre la demande de suppression : le compte devient immédiatement
 * inutilisable (tokens supprimés, sessions révoquées) et sera purgé
 * définitivement au bout de `grace_days` jours. Backend :
 * AccountDeletionController@destroy → RequestAccountDeletionAction.
 *
 * Le mot de passe (ou un id_token Google pour un compte sans mot de passe
 * connu) est exigé en plus du token : un téléphone déverrouillé laissé sans
 * surveillance ne doit pas suffire à détruire le compte.
 */
export async function deleteAccount(
  payload: DeleteAccountPayload,
): Promise<AccountDeletionData> {
  const { data } = await apiClient.delete<DeleteAccountResponse>('/me/account', {
    data: payload,
  });
  return data.data;
}

/**
 * POST /api/v1/me/account/cancel-deletion  (PUBLIQUE, sans token)
 *
 * Annule une demande de suppression et reconnecte l'utilisateur. La route est
 * volontairement publique : la demande a révoqué tous les credentials, il n'y
 * a donc plus de token à présenter — l'endpoint ré-authentifie par identifiants
 * comme /auth/login. Tous les échecs renvoient la même erreur générique.
 */
export async function cancelAccountDeletion(
  payload: CancelAccountDeletionPayload,
): Promise<TokenData> {
  const { data } = await apiClient.post<LoginResponse>(
    '/me/account/cancel-deletion',
    payload,
  );
  return data.data;
}
