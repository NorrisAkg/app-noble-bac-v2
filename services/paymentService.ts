import apiClient from './apiClient';
import type { ApiResponse, PaymentTransaction } from '@/types/api';

/**
 * Reponse de POST /api/v1/payments/initiate.
 * `transaction` contient le statut initial (pending) + l'internal_reference.
 * Le debit mobile money est declenche cote backend (push USSD sur le
 * telephone) : il n'y a plus d'URL hebergee a charger.
 */
export interface InitiatePaymentResponse {
  transaction: PaymentTransaction;
}

/**
 * Payload de POST /api/v1/payments/initiate.
 * `operatorId` cible le reseau mobile money choisi ; `phoneNumber` (E.164)
 * surcharge le numero du profil (optionnel).
 */
export interface InitiatePaymentPayload {
  subscriptionPlanId: number;
  operatorId: number;
  phoneNumber?: string;
}

/**
 * POST /api/v1/payments/initiate
 * Cree une Transaction (status=pending) et declenche le debit mobile money
 * direct via FedaPay (push de confirmation sur le telephone). L'activation
 * reelle de l'abonnement se fait via le webhook backend, jamais via la
 * reponse synchrone (cf api/.claude/CLAUDE.md). Le mobile poll ensuite
 * getPaymentStatus pour detecter la confirmation.
 */
export async function initiatePayment(
  payload: InitiatePaymentPayload,
): Promise<InitiatePaymentResponse> {
  const { data } = await apiClient.post<ApiResponse<InitiatePaymentResponse>>(
    '/payments/initiate',
    {
      subscription_plan_id: payload.subscriptionPlanId,
      operator_id: payload.operatorId,
      ...(payload.phoneNumber ? { phone_number: payload.phoneNumber } : {}),
    },
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
