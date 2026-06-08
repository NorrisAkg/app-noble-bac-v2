import {
  initiatePayment,
  getPaymentStatus,
  type InitiatePaymentResponse,
} from '../services/paymentService';
import apiClient from '../services/apiClient';
import type { PaymentTransaction } from '../types/api';

jest.mock('../services/apiClient');

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

const transactionFixture: PaymentTransaction = {
  id: 101,
  internal_reference: 'TX-NBL-AB12CD',
  gateway_transaction_id: null,
  status: 'pending',
  amount_fcfa: 5000,
  currency: 'XOF',
  plan: { id: 1, code: 'P30', label: 'Premium 30j', duration_days: 30, price_fcfa: 5000, currency: 'XOF' },
  webhook_received_at: null,
  confirmed_at: null,
  created_at: '2026-05-18T10:00:00Z',
};

describe('paymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initiatePayment', () => {
    it('POST /payments/initiate avec le bon body et deballe data', async () => {
      const response: InitiatePaymentResponse = {
        transaction: transactionFixture,
        payment_url: 'https://checkout.fedapay.com/payment/abc123',
      };
      mockedApiClient.post.mockResolvedValueOnce({
        data: { success: true, message: 'Paiement initié.', data: response },
      });

      const result = await initiatePayment(1);

      expect(mockedApiClient.post).toHaveBeenCalledWith('/payments/initiate', {
        subscription_plan_id: 1,
      });
      expect(result.payment_url).toBe('https://checkout.fedapay.com/payment/abc123');
      expect(result.transaction.id).toBe(101);
      expect(result.transaction.status).toBe('pending');
    });

    it('propage l\'erreur axios telle quelle (plan introuvable, scope mismatch, etc.)', async () => {
      mockedApiClient.post.mockRejectedValueOnce(new Error('Forbidden'));
      await expect(initiatePayment(99)).rejects.toThrow('Forbidden');
    });
  });

  describe('getPaymentStatus', () => {
    it('GET /payments/{id}/status et deballe data', async () => {
      const confirmed: PaymentTransaction = {
        ...transactionFixture,
        status: 'confirmed',
        webhook_received_at: '2026-05-18T10:02:00Z',
        confirmed_at: '2026-05-18T10:02:00Z',
        gateway_transaction_id: 'fdp_xyz',
      };
      mockedApiClient.get.mockResolvedValueOnce({
        data: { success: true, message: 'OK', data: confirmed },
      });

      const result = await getPaymentStatus(101);

      expect(mockedApiClient.get).toHaveBeenCalledWith('/payments/101/status');
      expect(result.status).toBe('confirmed');
      expect(result.gateway_transaction_id).toBe('fdp_xyz');
    });

    it('renvoie un statut failed sans erreur (cas paiement rejete)', async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          message: 'OK',
          data: { ...transactionFixture, status: 'failed' as const },
        },
      });

      const result = await getPaymentStatus(101);
      expect(result.status).toBe('failed');
    });

    it('propage l\'erreur axios telle quelle', async () => {
      mockedApiClient.get.mockRejectedValueOnce(new Error('Network error'));
      await expect(getPaymentStatus(101)).rejects.toThrow('Network error');
    });
  });
});
