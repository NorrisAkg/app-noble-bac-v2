import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import apiClient, { performRefresh, registerAuthCleanup } from '../services/apiClient';

const mockedSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe('apiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('performRefresh', () => {
    it('returns null when no refresh_token is stored', async () => {
      mockedSecureStore.getItemAsync.mockResolvedValueOnce(null);

      const result = await performRefresh();

      expect(result).toBeNull();
      expect(mockedSecureStore.setItemAsync).not.toHaveBeenCalled();
    });

    it('returns the new access_token and rotates both tokens on success', async () => {
      mockedSecureStore.getItemAsync.mockResolvedValueOnce('refresh-old');
      const postSpy = jest.spyOn(axios, 'post').mockResolvedValueOnce({
        data: {
          success: true,
          message: 'OK',
          data: {
            user: { id: 1 },
            access_token: 'access-new',
            refresh_token: 'refresh-new',
            expires_at: '2026-12-31T00:00:00Z',
          },
        },
      } as any);

      const result = await performRefresh();

      expect(result).toBe('access-new');
      expect(postSpy).toHaveBeenCalledWith(
        expect.stringContaining('/auth/refresh'),
        { refresh_token: 'refresh-old' },
        expect.any(Object),
      );
      expect(mockedSecureStore.setItemAsync).toHaveBeenCalledWith('access_token', 'access-new');
      expect(mockedSecureStore.setItemAsync).toHaveBeenCalledWith('refresh_token', 'refresh-new');
    });

    it('returns null when /auth/refresh throws', async () => {
      mockedSecureStore.getItemAsync.mockResolvedValueOnce('refresh-old');
      jest.spyOn(axios, 'post').mockRejectedValueOnce(new Error('boom'));

      const result = await performRefresh();

      expect(result).toBeNull();
      expect(mockedSecureStore.setItemAsync).not.toHaveBeenCalled();
    });

    it('returns null when the response payload is malformed', async () => {
      mockedSecureStore.getItemAsync.mockResolvedValueOnce('refresh-old');
      jest.spyOn(axios, 'post').mockResolvedValueOnce({ data: { data: {} } } as any);

      const result = await performRefresh();

      expect(result).toBeNull();
    });
  });

  describe('401 interceptor flow', () => {
    let originalAdapter: any;

    beforeEach(() => {
      originalAdapter = apiClient.defaults.adapter;
    });

    afterEach(() => {
      apiClient.defaults.adapter = originalAdapter;
    });

    it('on 401, refreshes once and retries the original request with the new token', async () => {
      // Tokens in store
      mockedSecureStore.getItemAsync
        .mockResolvedValueOnce('access-old') // request interceptor: 1st call
        .mockResolvedValueOnce('refresh-old') // performRefresh reads refresh
        .mockResolvedValueOnce('access-new'); // request interceptor: retry
      jest.spyOn(axios, 'post').mockResolvedValueOnce({
        data: {
          data: {
            access_token: 'access-new',
            refresh_token: 'refresh-new',
          },
        },
      } as any);

      let callCount = 0;
      apiClient.defaults.adapter = jest.fn(async (config: any) => {
        callCount += 1;
        if (callCount === 1) {
          // First call: 401
          const err: any = new Error('Unauthorized');
          err.response = { status: 401, data: {}, headers: {}, config, statusText: 'Unauthorized' };
          err.config = config;
          err.isAxiosError = true;
          throw err;
        }
        // Retry: succeeds, echoes the Authorization header
        return {
          data: { ok: true, sentAuth: config.headers.get('Authorization') },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        };
      }) as any;

      const response = await apiClient.get('/protected/resource');

      expect(response.data.ok).toBe(true);
      expect(response.data.sentAuth).toBe('Bearer access-new');
      expect(callCount).toBe(2);
    });

    it('on 401 with failed refresh, clears storage and notifies the cleanup hook', async () => {
      mockedSecureStore.getItemAsync
        .mockResolvedValueOnce('access-old') // request interceptor
        .mockResolvedValueOnce(null); // performRefresh finds no refresh_token

      const cleanup = jest.fn();
      registerAuthCleanup(cleanup);

      apiClient.defaults.adapter = jest.fn(async (config: any) => {
        const err: any = new Error('Unauthorized');
        err.response = { status: 401, data: {}, headers: {}, config, statusText: 'Unauthorized' };
        err.config = config;
        err.isAxiosError = true;
        throw err;
      }) as any;

      await expect(apiClient.get('/protected/resource')).rejects.toBeDefined();

      expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith('access_token');
      expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith('refresh_token');
      expect(cleanup).toHaveBeenCalledTimes(1);

      // Reset the hook so it doesn't leak into other suites.
      registerAuthCleanup(() => undefined);
    });

    it('does not loop forever when the refresh call itself returns 401', async () => {
      mockedSecureStore.getItemAsync.mockResolvedValueOnce('refresh-old');
      // Simulate axios.post (the bare refresh call) rejecting with 401
      jest.spyOn(axios, 'post').mockRejectedValueOnce(
        Object.assign(new Error('Unauthorized'), {
          response: { status: 401 },
          isAxiosError: true,
        }),
      );

      const result = await performRefresh();

      // It returns null instead of retrying.
      expect(result).toBeNull();
    });
  });
});
