import {
  getActiveSubscription,
  getSubscriptionPlans,
  getTransactions,
} from '../services/subscriptionService';
import apiClient from '../services/apiClient';

jest.mock('../services/apiClient');

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('subscriptionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getSubscriptionPlans GET /subscriptions/plans et deballe data', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'OK',
        data: [
          { id: 1, code: 'P7', label: '7 jours', duration_days: 7, price_fcfa: 500, currency: 'XOF' },
          { id: 2, code: 'P30', label: '30 jours', duration_days: 30, price_fcfa: 1000, currency: 'XOF' },
          { id: 3, code: 'P90', label: '90 jours', duration_days: 90, price_fcfa: 3000, currency: 'XOF' },
        ],
      },
    });

    const result = await getSubscriptionPlans();

    expect(mockedApiClient.get).toHaveBeenCalledWith('/subscriptions/plans');
    expect(result).toHaveLength(3);
    expect(result[0].price_fcfa).toBe(500);
    expect(result[2].duration_days).toBe(90);
  });

  it('getActiveSubscription GET /subscriptions/active retourne la subscription', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'OK',
        data: {
          id: 42,
          status: 'active',
          country_id: 1,
          series_id: 7,
          plan: { id: 2, code: 'P30', label: '30 jours', duration_days: 30, price_fcfa: 1000, currency: 'XOF' },
          started_at: '2026-05-01T10:00:00Z',
          expires_at: '2026-05-31T10:00:00Z',
        },
      },
    });

    const result = await getActiveSubscription();

    expect(mockedApiClient.get).toHaveBeenCalledWith('/subscriptions/active');
    expect(result?.id).toBe(42);
    expect(result?.status).toBe('active');
    expect(result?.plan?.code).toBe('P30');
  });

  it('getActiveSubscription gere null quand aucun abonnement actif', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: { success: true, message: 'OK', data: null },
    });

    const result = await getActiveSubscription();

    expect(result).toBeNull();
  });

  it('getTransactions GET /subscriptions/transactions avec params pagination', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'OK',
        data: [
          {
            id: 1,
            internal_reference: 'ref-1',
            cinetpay_transaction_id: 'cnpy-1',
            status: 'confirmed',
            amount_fcfa: 1000,
            currency: 'XOF',
            plan: { id: 2, code: 'P30', label: '30 jours', duration_days: 30, price_fcfa: 1000, currency: 'XOF' },
            webhook_received_at: '2026-05-01T10:01:00Z',
            confirmed_at: '2026-05-01T10:01:00Z',
            created_at: '2026-05-01T10:00:00Z',
          },
        ],
        meta: { current_page: 1, per_page: 20, total: 1, last_page: 1 },
      },
    });

    const result = await getTransactions({ page: 1, per_page: 20 });

    expect(mockedApiClient.get).toHaveBeenCalledWith('/subscriptions/transactions', {
      params: { page: 1, per_page: 20 },
    });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].status).toBe('confirmed');
    expect(result.meta?.total).toBe(1);
  });

  it('getTransactions sans params envoie un objet vide', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: { success: true, message: 'OK', data: [] },
    });

    await getTransactions();

    expect(mockedApiClient.get).toHaveBeenCalledWith('/subscriptions/transactions', { params: {} });
  });
});
