import { isAxiosError } from 'axios';
import type { ApiError } from '@/types/api';

/**
 * Extracts a user-friendly error message from an Axios error.
 * Falls back to a generic message if the server response is unexpected.
 *
 * Couvre trois cas :
 *  1. Axios + réponse serveur avec `message` → retourne le message serveur.
 *  2. Axios + pas de réponse → erreur réseau explicite.
 *  3. Axios + réponse sans message → "Erreur serveur (HTTP <status>)" pour
 *     ne pas masquer le vrai code (typiquement 500 sans body JSON).
 *  4. Erreur JS classique avec un `message` non vide → on remonte le message.
 *  5. Tout le reste → fallback générique.
 */
export function getApiErrorMessage(error: unknown, fallback = 'Une erreur est survenue.'): string {
  if (isAxiosError<ApiError>(error)) {
    const serverMessage = error.response?.data?.message;
    if (serverMessage) return serverMessage;

    if (!error.response) {
      return 'Impossible de contacter le serveur. Vérifiez votre connexion.';
    }

    return `Erreur serveur (HTTP ${error.response.status}).`;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

/**
 * Lit le canal de vérification renvoyé avec un 403 « compte non vérifié ».
 *
 * Le backend le transporte dans `errors` faute d'une clé de premier niveau
 * dans l'enveloppe. Lecture distincte de getValidationErrors, qui ne
 * s'intéresse qu'aux 422 : confondre les deux ferait passer un refus de
 * connexion pour une erreur de saisie.
 *
 * Renvoie null si l'erreur n'est pas un 403 de ce type, ou si le compte n'a
 * aucun canal exploitable.
 */
export function getVerificationChannel(error: unknown): 'email' | 'phone' | null {
  if (!isAxiosError<ApiError>(error) || error.response?.status !== 403) {
    return null;
  }

  const channel = error.response.data?.errors?.verification_channel?.[0];

  return channel === 'email' || channel === 'phone' ? channel : null;
}

/**
 * Extracts field-level validation errors from a 422 response.
 * Returns a flat map of { fieldName: firstErrorMessage }.
 */
export function getValidationErrors(error: unknown): Record<string, string> {
  if (isAxiosError<ApiError>(error) && error.response?.status === 422) {
    const errors = error.response.data?.errors;
    if (!errors) return {};
    return Object.fromEntries(
      Object.entries(errors).map(([field, messages]) => [field, messages[0]])
    );
  }
  return {};
}
