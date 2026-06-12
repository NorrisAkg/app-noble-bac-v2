import apiClient from './apiClient';
import type { ApiResponse, Quote } from '@/types/api';

export const quotesService = {
  /**
   * GET /api/v1/quotes
   * Citations actives (max 10) pour le bloc « Un mot pour aujourd'hui ».
   * La rotation est faite côté client (carrousel auto, cf. maquette).
   */
  getQuotes: async (): Promise<Quote[]> => {
    const response = await apiClient.get<ApiResponse<Quote[]>>('/quotes');
    return response.data.data;
  },
};
