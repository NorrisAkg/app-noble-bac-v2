import {
  requestPasswordReset,
  resetPassword,
  verifyOtp,
  login,
  refreshToken,
  sendOtp,
} from '../services/authService';
import apiClient from '../services/apiClient';

jest.mock('../services/apiClient');

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyOtp', () => {
    it('posts {phone, code} to /auth/verify-otp', async () => {
      mockedApiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          message: 'OK',
          data: {
            user: { id: '1' },
            access_token: 'access-1',
            refresh_token: 'refresh-1',
            expires_at: '2026-12-31T00:00:00Z',
          },
        },
      });

      const result = await verifyOtp({ phone: '+22590123456', code: '123456' });

      expect(mockedApiClient.post).toHaveBeenCalledWith('/auth/verify-otp', {
        phone: '+22590123456',
        code: '123456',
      });
      expect(result.data.access_token).toBe('access-1');
    });
  });

  describe('sendOtp', () => {
    it('posts {phone} to /auth/send-otp', async () => {
      mockedApiClient.post.mockResolvedValueOnce({
        data: { success: true, message: 'Code envoyé.', data: null },
      });

      await sendOtp({ phone: '+22590123456' });

      expect(mockedApiClient.post).toHaveBeenCalledWith('/auth/send-otp', {
        phone: '+22590123456',
      });
    });
  });

  describe('requestPasswordReset', () => {
    it('posts {phone} to /auth/password/request-reset', async () => {
      mockedApiClient.post.mockResolvedValueOnce({
        data: { success: true, message: 'OK', data: null },
      });

      await requestPasswordReset({ phone: '+22790123456' });

      expect(mockedApiClient.post).toHaveBeenCalledWith('/auth/password/request-reset', {
        phone: '+22790123456',
      });
    });
  });

  describe('resetPassword', () => {
    it('posts {phone, code, password, password_confirmation} to /auth/password/reset', async () => {
      mockedApiClient.post.mockResolvedValueOnce({
        data: { success: true, message: 'OK', data: null },
      });

      await resetPassword({
        phone: '+22790123456',
        code: '654321',
        password: '1234',
        password_confirmation: '1234',
      });

      expect(mockedApiClient.post).toHaveBeenCalledWith('/auth/password/reset', {
        phone: '+22790123456',
        code: '654321',
        password: '1234',
        password_confirmation: '1234',
      });
    });
  });

  describe('login', () => {
    it('posts credentials and returns the token envelope', async () => {
      mockedApiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          message: 'OK',
          data: {
            user: { id: '1' },
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
  });

  describe('refreshToken', () => {
    it('posts to /auth/refresh', async () => {
      mockedApiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          message: 'OK',
          data: {
            user: { id: '1' },
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
});
