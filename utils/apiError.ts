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
