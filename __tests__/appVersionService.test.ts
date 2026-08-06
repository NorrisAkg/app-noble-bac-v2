import { fetchAppVersion, getCurrentAppVersion } from '../services/appVersionService';
import apiClient from '../services/apiClient';

jest.mock('../services/apiClient');

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

const payload = {
  platform: 'android',
  current: '1.0.0',
  min_supported: '1.1.0',
  latest: '1.3.0',
  store_url: 'https://play.google.com/store/apps/details?id=com.noble_bac',
  force_update: true,
  update_available: true,
};

describe('appVersionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reads the installed version from expoConfig', () => {
    expect(getCurrentAppVersion()).toBe('1.0.0');
  });

  it('sends the platform and installed version, and unwraps the envelope', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: { success: true, message: 'OK', data: payload },
    });

    const result = await fetchAppVersion();

    expect(mockedApiClient.get).toHaveBeenCalledWith(
      '/app-version',
      expect.objectContaining({
        params: { platform: 'ios', version: '1.0.0' },
        timeout: 5000,
      }),
    );
    expect(result).toEqual(payload);
  });

  it('fails open: returns null when the API is unreachable', async () => {
    mockedApiClient.get.mockRejectedValueOnce(new Error('Network Error'));

    await expect(fetchAppVersion()).resolves.toBeNull();
  });
});
