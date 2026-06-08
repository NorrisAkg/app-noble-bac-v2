import apiClient from './apiClient';
import type { ApiResponse, PaymentTransaction } from '@/types/api';

/**
 * Reponse de POST /api/v1/payments/initiate.
 * `transaction` contient le statut initial (pending) + l'internal_reference.
 * `payment_url` est l'URL FedaPay a charger dans la WebView mobile.
 */
export interface InitiatePaymentResponse {
  transaction: PaymentTransaction;
  payment_url: string;
}

/**
 * POST /api/v1/payments/initiate
 * Cree une Transaction en base (status=pending) et renvoie l'URL FedaPay
 * a ouvrir cote mobile. L'activation reelle de l'abonnement se fait via le
 * webhook backend, jamais via la reponse synchrone FedaPay (cf
 * api/.claude/CLAUDE.md).
 */
export async function initiatePayment(
  subscriptionPlanId: number,
): Promise<InitiatePaymentResponse> {
  const { data } = await apiClient.post<ApiResponse<InitiatePaymentResponse>>(
    '/payments/initiate',
    { subscription_plan_id: subscriptionPlanId },
  );
  return data.data;
}

/**
 * GET /api/v1/payments/{transaction}/status
 * Renvoie le statut courant de la transaction. Si encore `pending` cote local,
 * le backend interroge FedaPay et met a jour si besoin avant de repondre.
 * Le mobile poll cet endpoint pendant le checkout pour detecter une
 * confirmation rapide sans dependre du redirect retour FedaPay.
 */
export async function getPaymentStatus(
  transactionId: number,
): Promise<PaymentTransaction> {
  const { data } = await apiClient.get<ApiResponse<PaymentTransaction>>(
    `/payments/${transactionId}/status`,
  );
  return data.data;
}
