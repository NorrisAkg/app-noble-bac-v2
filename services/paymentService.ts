import apiClient from './apiClient';
import type { ApiResponse, PaymentTransaction } from '@/types/api';

/**
 * Reponse de POST /api/v1/payments/initiate.
 * `transaction` contient le statut initial (pending) + l'internal_reference.
 * `payment_url` est la page de paiement hebergee FedaPay a ouvrir : le client
 * la charge, l'utilisateur paie, puis le mobile poll getPaymentStatus pour
 * detecter la confirmation (l'activation se fait via webhook / poll backend).
 */
export interface InitiatePaymentResponse {
  transaction: PaymentTransaction;
  payment_url: string | null;
}

/**
 * Payload de POST /api/v1/payments/initiate.
 * `operatorId` est optionnel pour le checkout hébergé (Moneroo) — l'utilisateur
 * sélectionne son opérateur sur la page de paiement. Requis uniquement pour
 * FedaPay direct charge.
 */
export interface InitiatePaymentPayload {
  subscriptionPlanId: number;
  operatorId?: number;
  phoneNumber?: string;
}

/**
 * POST /api/v1/payments/initiate
 * Cree une Transaction (status=pending) et renvoie `payment_url`, la page de
 * paiement hebergee FedaPay a ouvrir. L'activation reelle de l'abonnement se
 * fait via le webhook backend / le poll de statut, jamais via la reponse
 * synchrone (cf api/.claude/CLAUDE.md). Le mobile poll ensuite
 * getPaymentStatus pour detecter la confirmation.
 */
export async function initiatePayment(
  payload: InitiatePaymentPayload,
): Promise<InitiatePaymentResponse> {
  const { data } = await apiClient.post<ApiResponse<InitiatePaymentResponse>>(
    '/payments/initiate',
    {
      subscription_plan_id: payload.subscriptionPlanId,
      ...(payload.operatorId !== undefined ? { operator_id: payload.operatorId } : {}),
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
