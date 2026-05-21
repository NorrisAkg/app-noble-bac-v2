import apiClient from './apiClient';
import type { ApiResponse, MeStats } from '@/types/api';

/**
 * GET /api/v1/me/stats
 * Stats agrégées de l'utilisateur courant (cache 60s côté backend).
 * Renvoie quiz_count, average_score_pct, exams_consulted.
 */
export async function getMeStats(): Promise<MeStats> {
  const { data } = await apiClient.get<ApiResponse<MeStats>>('/me/stats');
  return data.data;
}
