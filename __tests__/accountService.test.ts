import { cancelAccountDeletion, deleteAccount } from '../services/accountService';
import apiClient from '../services/apiClient';
import type { AccountDeletionData } from '../types/api';

jest.mock('../services/apiClient');

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

const deletionFixture: AccountDeletionData = {
  deletion_requested_at: '2026-08-11T10:00:00+00:00',
  purge_at: '2026-09-10T10:00:00+00:00',
  grace_days: 30,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('deleteAccount', () => {
  it('envoie le motif, la confirmation et le mot de passe dans le corps du DELETE', async () => {
    mockedApiClient.delete.mockResolvedValue({
      data: { success: true, message: 'OK', data: deletionFixture },
    });

    const result = await deleteAccount({
      reason: 'no_longer_using',
      confirmation: 'SUPPRIMER',
      password: 'motdepasse123',
    });

    // Axios n'envoie un corps sur DELETE que via la clé `data` de la config :
    // le passer en second argument nu le perdrait silencieusement.
    expect(mockedApiClient.delete).toHaveBeenCalledWith('/me/account', {
      data: {
        reason: 'no_longer_using',
        confirmation: 'SUPPRIMER',
        password: 'motdepasse123',
      },
    });
    expect(result).toEqual(deletionFixture);
  });

  it('accepte un id_token Google à la place du mot de passe', async () => {
    mockedApiClient.delete.mockResolvedValue({
      data: { success: true, message: 'OK', data: deletionFixture },
    });

    await deleteAccount({
      reason: 'privacy_concerns',
      confirmation: 'SUPPRIMER',
      google_id_token: 'token-google',
    });

    expect(mockedApiClient.delete).toHaveBeenCalledWith('/me/account', {
      data: {
        reason: 'privacy_concerns',
        confirmation: 'SUPPRIMER',
        google_id_token: 'token-google',
      },
    });
  });

  it('expose la date de purge renvoyée par le serveur', async () => {
    mockedApiClient.delete.mockResolvedValue({
      data: { success: true, message: 'OK', data: deletionFixture },
    });

    const result = await deleteAccount({
      reason: 'other',
      confirmation: 'SUPPRIMER',
      password: 'x',
    });

    expect(result.purge_at).toBe('2026-09-10T10:00:00+00:00');
    expect(result.grace_days).toBe(30);
  });
});

describe('cancelAccountDeletion', () => {
  it('poste les identifiants sur la route publique et déballe les tokens', async () => {
    const tokens = {
      user: { id: 42 },
      access_token: 'access',
      refresh_token: 'refresh',
      expires_at: '2026-08-11T12:00:00+00:00',
    };
    mockedApiClient.post.mockResolvedValue({
      data: { success: true, message: 'OK', data: tokens },
    });

    const result = await cancelAccountDeletion({
      identifier: 'awa@example.com',
      password: 'motdepasse123',
    });

    expect(mockedApiClient.post).toHaveBeenCalledWith('/me/account/cancel-deletion', {
      identifier: 'awa@example.com',
      password: 'motdepasse123',
    });
    expect(result).toEqual(tokens);
  });
});
