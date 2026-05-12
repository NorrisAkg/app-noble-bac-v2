import { isAxiosError } from 'axios';
import type { ApiError } from '@/types/api';

/**
 * Extracts a user-friendly error message from an Axios error.
 * Falls back to a generic message if the server response is unexpected.
 */
export function getApiErrorMessage(error: unknown, fallback = 'Une erreur est survenue.'): string {
  if (isAxiosError<ApiError>(error)) {
    const serverMessage = error.response?.data?.message;
    if (serverMessage) return serverMessage;

    // Network error (no response)
    if (!error.response) return 'Impossible de contacter le serveur. Vérifiez votre connexion.';
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
