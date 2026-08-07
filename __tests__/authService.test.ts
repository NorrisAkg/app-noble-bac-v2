import {
  requestPasswordReset,
  resetPassword,
  verifyOtp,
  verifyEmail,
  resendEmailCode,
  googleSignIn,
  login,
  register,
  sendOtp,
} from '../services/authService';
import apiClient from '../services/apiClient';

jest.mock('../services/apiClient');

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

const tokenEnvelope = {
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
};

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('poste email, mot de passe et confirmation, sans téléphone', async () => {
      mockedApiClient.post.mockResolvedValueOnce({
        data: { success: true, message: 'OK', data: { id: '1' } },
      });

      await register({
        first_name: 'Awa',
        last_name: 'Diop',
        email: 'awa@noble-bac.com',
        password: 'motdepasse8',
        password_confirmation: 'motdepasse8',
        country_id: '1',
      });

      expect(mockedApiClient.post).toHaveBeenCalledWith('/auth/register', {
        first_name: 'Awa',
        last_name: 'Diop',
        email: 'awa@noble-bac.com',
        password: 'motdepasse8',
        password_confirmation: 'motdepasse8',
        country_id: '1',
      });
    });

    it('transmet le téléphone quand il est fourni', async () => {
      mockedApiClient.post.mockResolvedValueOnce({
        data: { success: true, message: 'OK', data: { id: '1' } },
      });

      await register({
        first_name: 'Awa',
        last_name: 'Diop',
        email: 'awa@noble-bac.com',
        password: 'motdepasse8',
        password_confirmation: 'motdepasse8',
        phone: '+22790123456',
        country_id: '1',
      });

      expect(mockedApiClient.post).toHaveBeenCalledWith(
        '/auth/register',
        expect.objectContaining({ phone: '+22790123456' }),
      );
    });
  });

  describe('verifyEmail', () => {
    it('poste {email, code} à /auth/email/verify et renvoie les tokens', async () => {
      mockedApiClient.post.mockResolvedValueOnce(tokenEnvelope);

      const result = await verifyEmail({ email: 'awa@noble-bac.com', code: '123456' });

      expect(mockedApiClient.post).toHaveBeenCalledWith('/auth/email/verify', {
        email: 'awa@noble-bac.com',
        code: '123456',
      });
      expect(result.data.access_token).toBe('access-1');
    });
  });

  describe('resendEmailCode', () => {
    it('poste {email} à /auth/email/resend', async () => {
      mockedApiClient.post.mockResolvedValueOnce({
        data: { success: true, message: 'OK', data: null },
      });

      await resendEmailCode({ email: 'awa@noble-bac.com' });

      expect(mockedApiClient.post).toHaveBeenCalledWith('/auth/email/resend', {
        email: 'awa@noble-bac.com',
      });
    });
  });

  describe('googleSignIn', () => {
    it('poste l\'id_token seul quand aucun pays n\'est fourni', async () => {
      mockedApiClient.post.mockResolvedValueOnce(tokenEnvelope);

      const result = await googleSignIn({ id_token: 'jeton-google' });

      expect(mockedApiClient.post).toHaveBeenCalledWith('/auth/google', {
        id_token: 'jeton-google',
      });
      expect(result.data.access_token).toBe('access-1');
    });

    it('joint le pays quand le compte doit être créé', async () => {
      mockedApiClient.post.mockResolvedValueOnce(tokenEnvelope);

      await googleSignIn({ id_token: 'jeton-google', country_id: '3' });

      expect(mockedApiClient.post).toHaveBeenCalledWith('/auth/google', {
        id_token: 'jeton-google',
        country_id: '3',
      });
    });
  });

  describe('login', () => {
    it('poste un identifiant, qui peut être un email', async () => {
      mockedApiClient.post.mockResolvedValueOnce(tokenEnvelope);

      const result = await login({ identifier: 'awa@noble-bac.com', password: 'motdepasse8' });

      expect(mockedApiClient.post).toHaveBeenCalledWith('/auth/login', {
        identifier: 'awa@noble-bac.com',
        password: 'motdepasse8',
      });
      expect(result.data.access_token).toBe('access-1');
    });

    it('poste un identifiant, qui peut être un numéro', async () => {
      // Les comptes créés avant la refonte n'ont pas d'email : le même champ
      // doit continuer d'accepter un E.164.
      mockedApiClient.post.mockResolvedValueOnce(tokenEnvelope);

      await login({ identifier: '+22790123456', password: '1234' });

      expect(mockedApiClient.post).toHaveBeenCalledWith('/auth/login', {
        identifier: '+22790123456',
        password: '1234',
      });
    });
  });

  describe('requestPasswordReset', () => {
    it('poste {identifier} à /auth/password/request-reset', async () => {
      mockedApiClient.post.mockResolvedValueOnce({
        data: { success: true, message: 'OK', data: null },
      });

      await requestPasswordReset({ identifier: 'awa@noble-bac.com' });

      expect(mockedApiClient.post).toHaveBeenCalledWith('/auth/password/request-reset', {
        identifier: 'awa@noble-bac.com',
      });
    });
  });

  describe('resetPassword', () => {
    it('poste identifiant, code et nouveau mot de passe', async () => {
      mockedApiClient.post.mockResolvedValueOnce({
        data: { success: true, message: 'OK', data: null },
      });

      await resetPassword({
        identifier: 'awa@noble-bac.com',
        code: '654321',
        password: 'nouveaupass8',
        password_confirmation: 'nouveaupass8',
      });

      expect(mockedApiClient.post).toHaveBeenCalledWith('/auth/password/reset', {
        identifier: 'awa@noble-bac.com',
        code: '654321',
        password: 'nouveaupass8',
        password_confirmation: 'nouveaupass8',
      });
    });
  });

  describe('verifyOtp', () => {
    it('poste {phone, code} à /auth/verify-otp', async () => {
      // Conservé pour les comptes historiques, sans email.
      mockedApiClient.post.mockResolvedValueOnce(tokenEnvelope);

      const result = await verifyOtp({ phone: '+22590123456', code: '123456' });

      expect(mockedApiClient.post).toHaveBeenCalledWith('/auth/verify-otp', {
        phone: '+22590123456',
        code: '123456',
      });
      expect(result.data.access_token).toBe('access-1');
    });
  });

  describe('sendOtp', () => {
    it('poste {phone} à /auth/send-otp', async () => {
      mockedApiClient.post.mockResolvedValueOnce({
        data: { success: true, message: 'Code envoyé.', data: null },
      });

      await sendOtp({ phone: '+22590123456' });

      expect(mockedApiClient.post).toHaveBeenCalledWith('/auth/send-otp', {
        phone: '+22590123456',
      });
    });
  });
});
