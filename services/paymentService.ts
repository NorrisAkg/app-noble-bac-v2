import apiClient from './apiClient';
import type { ApiResponse, PaymentTransaction } from '@/types/api';

/**
 * Comment poursuivre le paiement, annoncé explicitement par le backend.
 * - `hosted_checkout` : ouvrir `payment_url` dans la WebView.
 * - `direct_charge`   : la demande USSD est partie, il n'y a qu'à attendre.
 *
 * Ne jamais redéduire ce mode de `payment_url` : une chaîne vide est falsy en
 * JS, donc un checkout hébergé raté ressemblait trait pour trait à un débit
 * direct réussi et l'app attendait 90 s un push jamais demandé.
 */
export type PaymentMode = 'direct_charge' | 'hosted_checkout';

/**
 * Reponse de POST /api/v1/payments/initiate.
 * `transaction` contient le statut initial (pending) + l'internal_reference.
 * `payment_url` est la page de paiement hebergee a ouvrir quand
 * `payment_mode === 'hosted_checkout'` : le client la charge, l'utilisateur
 * paie, puis le mobile poll getPaymentStatus pour detecter la confirmation
 * (l'activation se fait via webhook / poll backend).
 */
export interface InitiatePaymentResponse {
  transaction: PaymentTransaction;
  payment_url: string | null;
  payment_mode: PaymentMode;
}

/**
 * Payload de POST /api/v1/payments/initiate.
 * `operatorId` pilote le mode FedaPay : fourni + éligible → débit direct (USSD,
 * payment_url null) ; absent (ou opérateur non éligible) → checkout hébergé où
 * l'utilisateur choisit son opérateur sur la page de paiement. `phoneNumber`
 * est optionnel ; le backend retombe sur le numéro du profil s'il est absent.
 */
export interface InitiatePaymentPayload {
  subscriptionPlanId: number;
  operatorId?: number;
  phoneNumber?: string;
}

/**
 * Faut-il ouvrir la WebView de checkout, ou attendre une confirmation USSD ?
 *
 * Le mode fait foi ; l'URL n'est qu'un garde-fou pour un backend plus ancien
 * qui renverrait encore une chaîne vide. Un `hosted_checkout` sans URL n'ouvre
 * rien : il vaut mieux tomber sur le message de timeout que sur une WebView
 * blanche.
 */
export function shouldOpenHostedCheckout(
  response: Pick<InitiatePaymentResponse, 'payment_mode' | 'payment_url'>,
): boolean {
  return response.payment_mode === 'hosted_checkout' && !!response.payment_url;
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
