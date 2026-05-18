import apiClient from './apiClient';
import type {
  ApiResponse,
  DeclareDownloadPayload,
  OfflineQuotaStatus,
  UserDownload,
} from '@/types/api';

/**
 * GET /api/v1/me/downloads
 * Liste les downloads actifs du user authentifie + meta.quota.
 * Le backend filtre déjà `is_active=true` (cf MyDownloadsController::index).
 */
/**
 * Reponse specifique de GET /me/downloads : `meta` contient `quota` en plus
 * (ou a la place) des champs de pagination. On modelise comme un type
 * indepedant pour ne pas dependre du shape pagine generique d'ApiResponse.
 */
interface ListDownloadsResponse {
  success: boolean;
  message: string;
  data: UserDownload[];
  meta?: { quota?: OfflineQuotaStatus };
}

export async function listDownloads(): Promise<{
  downloads: UserDownload[];
  quota: OfflineQuotaStatus | null;
}> {
  const { data } = await apiClient.get<ListDownloadsResponse>('/me/downloads');
  return {
    downloads: data.data,
    quota: data.meta?.quota ?? null,
  };
}

/**
 * GET /api/v1/me/downloads/quota
 * Renvoie uniquement le payload OfflineQuotaStatus (utile pour rafraichir
 * sans recharger toute la liste).
 */
export async function getQuota(): Promise<OfflineQuotaStatus> {
  const { data } = await apiClient.get<ApiResponse<OfflineQuotaStatus>>('/me/downloads/quota');
  return data.data;
}

/**
 * POST /api/v1/me/downloads
 * Declare un nouveau telechargement polymorphe. Le backend repond 422 avec
 * un payload `suggestion` (QuotaExceededErrorPayload) quand le quota
 * glissant 90j est insuffisant.
 *
 * En cas de re-declaration d'un download deja actif dont l'URL est encore
 * valide, le backend renvoie le meme record avec `last_opened_at` rafraichi
 * (idempotence cote backend, cf DeclareDownloadAction).
 */
export async function declareDownload(payload: DeclareDownloadPayload): Promise<UserDownload> {
  const { data } = await apiClient.post<ApiResponse<UserDownload>>('/me/downloads', payload);
  return data.data;
}

/**
 * GET /api/v1/me/downloads/{id}
 * Touche `last_opened_at` cote backend + renvoie le record. Utilise pour
 * marquer un fichier comme "ouvert" et obtenir une URL signee fraiche
 * si l'ancienne est expiree.
 */
export async function getDownload(downloadId: number): Promise<UserDownload> {
  const { data } = await apiClient.get<ApiResponse<UserDownload>>(`/me/downloads/${downloadId}`);
  return data.data;
}

/**
 * DELETE /api/v1/me/downloads/{id}
 * Soft delete : passe `is_active=false` cote backend (le record est garde
 * en BDD pour audit + reactivation auto si le user re-souscrit Premium).
 * Le quota glissant libere immediatement l'espace.
 */
export async function revokeDownload(downloadId: number): Promise<void> {
  await apiClient.delete(`/me/downloads/${downloadId}`);
}
