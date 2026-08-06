import { Platform } from 'react-native';
import Constants from 'expo-constants';

import apiClient from './apiClient';
import type { ApiResponse, AppVersionInfo } from '@/types/api';

/** Version déclarée dans app.json — celle du binaire installé. */
export function getCurrentAppVersion(): string {
  return Constants.expoConfig?.version ?? '0.0.0';
}

/**
 * GET /api/v1/app-version
 *
 * Résout le contrat de compatibilité du binaire courant. Route publique :
 * un client obsolète doit pouvoir découvrir qu'il l'est sans session valide.
 *
 * Renvoie `null` sur toute erreur (réseau, 5xx, plateforme inconnue) : une API
 * injoignable ne doit jamais bloquer le démarrage de l'app.
 */
export async function fetchAppVersion(): Promise<AppVersionInfo | null> {
  try {
    const { data } = await apiClient.get<ApiResponse<AppVersionInfo>>('/app-version', {
      params: {
        platform: Platform.OS,
        version: getCurrentAppVersion(),
      },
      // Le splash attend cette réponse pour éviter un flash de l'app avant
      // l'écran bloquant. Un timeout court est donc indispensable : sans lui,
      // une connexion qui pend garderait l'app sur le splash indéfiniment.
      timeout: 5000,
    });
    return data.data;
  } catch {
    return null;
  }
}
