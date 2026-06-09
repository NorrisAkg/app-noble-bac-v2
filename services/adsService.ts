import apiClient from './apiClient';
import type { Advertisement } from '@/types/api';

export const adsService = {
  getAds: async (): Promise<Advertisement[]> => {
    const response = await apiClient.get<{ data: Advertisement[] }>('/ads');
    return response.data.data;
  },
};
