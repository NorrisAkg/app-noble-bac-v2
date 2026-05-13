import apiClient from './apiClient';
import type { ApiResponse, Country } from '@/types/api';

/**
 * GET /api/v1/countries
 * Public endpoint — returns all active countries with their series.
 * Response is server-side cached, so this is fast.
 */
export async function getCountries(): Promise<Country[]> {
  const { data } = await apiClient.get<ApiResponse<Country[]>>('/countries');
  return data.data;
}
