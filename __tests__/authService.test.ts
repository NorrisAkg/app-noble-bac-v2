import {
  requestPasswordReset,
  resetPassword,
  login,
  refreshToken,
} from '../services/authService';
import apiClient from '../services/apiClient';

jest.mock('../services/apiClient');

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('authService — password reset endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requestPasswordReset posts {phone} to /auth/password/request-reset', async () => {
    mockedApiClient.post.mockResolvedValueOnce({
      data: { success: true, message: 'OK', data: null },
    });

    await requestPasswordReset({ phone: '+22790123456' });

    expect(mockedApiClient.post).toHaveBeenCalledWith('/auth/password/request-reset', {
      phone: '+22790123456',
    });
  });

  it('resetPassword posts the full payload (phone, id_token, password, confirmation)', async () => {
    mockedApiClient.post.mockResolvedValueOnce({
      data: { success: true, message: 'OK', data: null },
    });

    await resetPassword({
      phone: '+22790123456',
      id_token: 'firebase-id-token-xyz',
      password: 'new-secret-123',
      password_confirmation: 'new-secret-123',
    });

    expect(mockedApiClient.post).toHaveBeenCalledWith('/auth/password/reset', {
      phone: '+22790123456',
      id_token: 'firebase-id-token-xyz',
      password: 'new-secret-123',
      password_confirmation: 'new-secret-123',
    });
  });

  it('login posts credentials and returns the token envelope', async () => {
    mockedApiClient.post.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'OK',
        data: {
          user: { id: 1 },
          access_token: 'access-1',
          refresh_token: 'refresh-1',
          expires_at: '2026-12-31T00:00:00Z',
        },
      },
    });

    const result = await login({ phone: '+22790123456', password: 'secret' });

    expect(mockedApiClient.post).toHaveBeenCalledWith('/auth/login', {
      phone: '+22790123456',
      password: 'secret',
    });
    expect(result.data.access_token).toBe('access-1');
  });

  it('refreshToken posts to /auth/refresh', async () => {
    mockedApiClient.post.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'OK',
        data: {
          user: { id: 1 },
          access_token: 'access-2',
          refresh_token: 'refresh-2',
          expires_at: '2026-12-31T00:00:00Z',
        },
      },
    });

    const result = await refreshToken();

    expect(mockedApiClient.post).toHaveBeenCalledWith('/auth/refresh');
    expect(result.data.access_token).toBe('access-2');
  });
});
