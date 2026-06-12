import apiClient from './apiClient';
import type { ApiResponse, LastRead, MeStats } from '@/types/api';

/**
 * GET /api/v1/me/stats
 * Stats agrégées de l'utilisateur courant (cache 60s côté backend).
 * Renvoie quiz_count, average_score_pct, exams_consulted.
 */
export async function getMeStats(): Promise<MeStats> {
  const { data } = await apiClient.get<ApiResponse<MeStats>>('/me/stats');
  return data.data;
}

/**
 * GET /api/v1/me/last-read
 * Dernière ressource ouverte (leçon ou fiche), null si aucune.
 */
export async function getLastRead(): Promise<LastRead | null> {
  const { data } = await apiClient.get<ApiResponse<LastRead | null>>('/me/last-read');
  return data.data;
}

/**
 * PATCH /api/v1/me/last-read
 * Déclare la lecture d'un contenu pour la carte « Reprendre » de l'accueil.
 * Upsert côté backend : tous les champs sont réécrits, ne déclarer qu'à la
 * fermeture du lecteur avec la progression finale de la session.
 */
export async function upsertLastRead(payload: {
  readable_type: 'lesson' | 'revision_sheet';
  readable_id: number;
  page_current?: number | null;
  page_total?: number | null;
  progress_pct?: number | null;
}): Promise<LastRead> {
  const { data } = await apiClient.patch<ApiResponse<LastRead>>('/me/last-read', payload);
  return data.data;
}
