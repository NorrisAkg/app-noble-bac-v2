import apiClient from './apiClient';
import type {
  ActiveSubscription,
  ApiResponse,
  PaymentTransaction,
  SubscriptionPlan,
} from '@/types/api';

/**
 * GET /api/v1/subscriptions/plans
 * Liste des offres Premium disponibles pour le user authentifie
 * (scope country/series applique cote backend via la Subscription cible).
 */
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const { data } = await apiClient.get<ApiResponse<SubscriptionPlan[]>>('/subscriptions/plans');
  return data.data;
}

/**
 * GET /api/v1/subscriptions/active
 * Renvoie l'abonnement actif courant ou null si aucun.
 * Le backend charge automatiquement la relation plan.
 */
export async function getActiveSubscription(): Promise<ActiveSubscription | null> {
  const { data } = await apiClient.get<ApiResponse<ActiveSubscription | null>>(
    '/subscriptions/active',
  );
  return data.data;
}

/**
 * GET /api/v1/subscriptions/transactions
 * Liste paginee des transactions du user (CinetPay). Pagination optionnelle :
 * `page` (1-indexe), `per_page` (defaut backend 20).
 */
export async function getTransactions(params: {
  page?: number;
  per_page?: number;
} = {}): Promise<ApiResponse<PaymentTransaction[]>> {
  const { data } = await apiClient.get<ApiResponse<PaymentTransaction[]>>(
    '/subscriptions/transactions',
    { params },
  );
  return data;
}
