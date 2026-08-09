import apiClient from './apiClient';
import type { ApiResponse, Country, ExamDateInfo, Operator } from '@/types/api';

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

/**
 * GET /api/v1/countries/{countryId}/exam-date
 * Prochaine session du BAC à venir pour le pays, telle que saisie par l'admin
 * dans le back-office. Server-side cached.
 *
 * Répond 404 tant qu'aucune date n'est saisie — un cas nominal, pas une panne :
 * l'erreur est laissée remonter et triée par isNotFound() dans useExamDate.
 */
export async function getExamDate(countryId: string | number): Promise<ExamDateInfo> {
  const { data } = await apiClient.get<ApiResponse<ExamDateInfo>>(
    `/countries/${countryId}/exam-date`,
  );
  return data.data;
}
