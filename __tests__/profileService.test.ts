import { getProfile, updateProfile } from '../services/profileService';
import apiClient from '../services/apiClient';
import type { UserProfile } from '../types/api';

jest.mock('../services/apiClient');

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

const profileFixture: UserProfile = {
  id: 42,
  first_name: 'Awa',
  last_name: 'Diallo',
  phone: '+221701234567',
  email: 'awa@example.com',
  gender: 'F',
  birth_date: '2005-06-15',
  avatar_url: null,
  country: { id: 1, name: 'Sénégal', code: 'SN', flag_emoji: '🇸🇳' },
  series: { id: 7, label: 'S2', code: 'S2' },
  phone_verified_at: '2026-04-01T10:00:00Z',
  is_active: true,
  is_admin: false,
  is_premium: true,
};

describe('profileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getProfile GET /profile et deballe data', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: { success: true, message: 'OK', data: profileFixture },
    });

    const result = await getProfile();

    expect(mockedApiClient.get).toHaveBeenCalledWith('/profile');
    expect(result.id).toBe(42);
    expect(result.country.name).toBe('Sénégal');
    expect(result.series.label).toBe('S2');
    expect(result.is_premium).toBe(true);
  });

  it('updateProfile PATCH /profile avec payload partiel', async () => {
    const updated = { ...profileFixture, first_name: 'Aïssa' };
    mockedApiClient.patch.mockResolvedValueOnce({
      data: { success: true, message: 'Profil mis à jour.', data: updated },
    });

    const result = await updateProfile({ first_name: 'Aïssa' });

    expect(mockedApiClient.patch).toHaveBeenCalledWith('/profile', { first_name: 'Aïssa' });
    expect(result.first_name).toBe('Aïssa');
    expect(result.last_name).toBe('Diallo'); // inchange
  });

  it('updateProfile peut envoyer un payload vide (pas de regression cote API)', async () => {
    mockedApiClient.patch.mockResolvedValueOnce({
      data: { success: true, message: 'Profil mis à jour.', data: profileFixture },
    });

    await updateProfile({});

    expect(mockedApiClient.patch).toHaveBeenCalledWith('/profile', {});
  });

  it('updateProfile propage l\'erreur axios telle quelle', async () => {
    const error = new Error('Network error');
    mockedApiClient.patch.mockRejectedValueOnce(error);

    await expect(updateProfile({ first_name: 'X' })).rejects.toThrow('Network error');
  });
});
