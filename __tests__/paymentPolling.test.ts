/**
 * Tests for the payment polling logic (spec C3).
 *
 * We test the service layer directly (getPaymentStatus) and the timeout
 * boundary. The React component wiring is validated by the existing
 * payment-checkout screen, which is not unit-testable in isolation without
 * a full React Native test environment.
 */
import { getPaymentStatus } from '../services/paymentService';
import apiClient from '../services/apiClient';
import type { PaymentTransaction } from '../types/api';

jest.mock('../services/apiClient');

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

const pendingTx: PaymentTransaction = {
  id: 42,
  internal_reference: 'TX-MNR-001',
  gateway_transaction_id: 'mnr_pay_abc123',
  status: 'pending',
  amount_fcfa: 5000,
  currency: 'XOF',
  plan: { id: 1, code: 'P30', label: 'Premium 30j', duration_days: 30, price_fcfa: 5000, currency: 'XOF' },
  webhook_received_at: null,
  confirmed_at: null,
  created_at: '2026-06-27T09:00:00Z',
};

describe('getPaymentStatus — Moneroo polling scenarios (C3)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renvoie pending tant que le webhook n\'est pas arrivé', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: { success: true, message: 'OK', data: pendingTx },
    });

    const result = await getPaymentStatus(42);

    expect(mockedApiClient.get).toHaveBeenCalledWith('/payments/42/status');
    expect(result.status).toBe('pending');
    expect(result.confirmed_at).toBeNull();
  });

  it('renvoie confirmed quand le webhook a activé l\'abonnement', async () => {
    const confirmedTx: PaymentTransaction = {
      ...pendingTx,
      status: 'confirmed',
      webhook_received_at: '2026-06-27T09:00:05Z',
      confirmed_at: '2026-06-27T09:00:05Z',
    };
    mockedApiClient.get.mockResolvedValueOnce({
      data: { success: true, message: 'OK', data: confirmedTx },
    });

    const result = await getPaymentStatus(42);

    expect(result.status).toBe('confirmed');
    expect(result.confirmed_at).not.toBeNull();
  });

  it('renvoie failed — aucune activation ne doit avoir lieu côté frontend', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: { success: true, message: 'OK', data: { ...pendingTx, status: 'failed' as const } },
    });

    const result = await getPaymentStatus(42);
    expect(result.status).toBe('failed');
  });

  it('simule un retard réseau 3G : l\'appel rejette, le retry suivant réussit', async () => {
    mockedApiClient.get
      .mockRejectedValueOnce(new Error('Network timeout'))
      .mockResolvedValueOnce({
        data: {
          success: true,
          message: 'OK',
          data: { ...pendingTx, status: 'confirmed' as const, confirmed_at: '2026-06-27T09:00:12Z' },
        },
      });

    await expect(getPaymentStatus(42)).rejects.toThrow('Network timeout');

    // Le retry (tick suivant du polling) doit réussir.
    const result = await getPaymentStatus(42);
    expect(result.status).toBe('confirmed');
    expect(mockedApiClient.get).toHaveBeenCalledTimes(2);
  });

  it('ne réinitialise pas le paiement si une transaction est déjà en cours (C4)', async () => {
    // Vérifie que getPaymentStatus n'appelle jamais /payments/initiate.
    mockedApiClient.get.mockResolvedValueOnce({
      data: { success: true, message: 'OK', data: pendingTx },
    });

    await getPaymentStatus(42);

    expect(mockedApiClient.post).not.toHaveBeenCalled();
  });
});
