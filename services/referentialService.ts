import apiClient from './apiClient';
import type { ApiResponse, Country, Operator } from '@/types/api';

/**
 * GET /api/v1/countries
 * Public endpoint — returns all active countries with their series.
 * Response is server-side cached, so this is fast.
 */
export async function getCountries(): Promise<Country[]> {
  const { data } = await apiClient.get<ApiResponse<Country[]>>('/countries');
  return data.data;
}

/**
 * GET /api/v1/countries/{countryId}/operators
 * Mobile money operators available for the country, driving the operator
 * picker on the checkout. Returns an empty list when payment is disabled for
 * the country (or none is configured), in which case the UI shows its empty
 * state. Server-side cached.
 */
export async function getOperators(countryId: string | number): Promise<Operator[]> {
  const { data } = await apiClient.get<ApiResponse<Operator[]>>(
    `/countries/${countryId}/operators`,
  );
  return data.data;
}
