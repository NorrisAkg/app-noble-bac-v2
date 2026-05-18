import auth from '@react-native-firebase/auth';
import {
  firebaseAuthService,
  FirebaseOtpError,
} from '../services/firebaseAuthService';

jest.mock('@react-native-firebase/auth', () => {
  const signInWithPhoneNumber = jest.fn();
  return {
    __esModule: true,
    default: jest.fn(() => ({ signInWithPhoneNumber })),
  };
});

const mockedAuthFn = auth as unknown as jest.Mock;

function mockSignInWithPhoneNumber(): jest.Mock {
  return mockedAuthFn().signInWithPhoneNumber as jest.Mock;
}

describe('firebaseAuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    firebaseAuthService._resetForTesting();
  });

  describe('sendVerificationCode', () => {
    it('appelle signInWithPhoneNumber et renvoie verificationId', async () => {
      mockSignInWithPhoneNumber().mockResolvedValueOnce({
        verificationId: 'vid-abc-123',
        confirm: jest.fn(),
      });

      const result = await firebaseAuthService.sendVerificationCode('+221701234567');

      expect(mockSignInWithPhoneNumber()).toHaveBeenCalledWith('+221701234567');
      expect(result).toBe('vid-abc-123');
    });

    it('renvoie "" si verificationId absent (cas SDK qui ne le remplit pas)', async () => {
      mockSignInWithPhoneNumber().mockResolvedValueOnce({ confirm: jest.fn() });

      const result = await firebaseAuthService.sendVerificationCode('+221701234567');
      expect(result).toBe('');
    });

    it('mappe auth/invalid-phone-number sur un message FR clair', async () => {
      mockSignInWithPhoneNumber().mockRejectedValueOnce({
        code: 'auth/invalid-phone-number',
        message: 'raw',
      });

      try {
        await firebaseAuthService.sendVerificationCode('garbage');
        throw new Error('expected to throw');
      } catch (e) {
        expect(e).toBeInstanceOf(FirebaseOtpError);
        expect((e as FirebaseOtpError).code).toBe('auth/invalid-phone-number');
        expect((e as FirebaseOtpError).message).toBe('Numéro de téléphone invalide.');
      }
    });

    it('mappe auth/too-many-requests', async () => {
      mockSignInWithPhoneNumber().mockRejectedValueOnce({
        code: 'auth/too-many-requests',
      });

      await expect(
        firebaseAuthService.sendVerificationCode('+221701234567'),
      ).rejects.toMatchObject({
        code: 'auth/too-many-requests',
        message: 'Trop de tentatives. Reessaie dans quelques minutes.',
      });
    });

    it('mappe auth/network-request-failed', async () => {
      mockSignInWithPhoneNumber().mockRejectedValueOnce({
        code: 'auth/network-request-failed',
      });

      await expect(
        firebaseAuthService.sendVerificationCode('+221701234567'),
      ).rejects.toMatchObject({ code: 'auth/network-request-failed' });
    });

    it('fallback message neutre pour code inconnu', async () => {
      mockSignInWithPhoneNumber().mockRejectedValueOnce({
        code: 'auth/some-unknown',
        message: 'X',
      });

      await expect(
        firebaseAuthService.sendVerificationCode('+221701234567'),
      ).rejects.toMatchObject({ message: 'X', code: 'auth/some-unknown' });
    });
  });

  describe('confirmVerificationCode', () => {
    it('throw si aucune confirmation active', async () => {
      await expect(
        firebaseAuthService.confirmVerificationCode('vid-1', '123456'),
      ).rejects.toMatchObject({
        code: 'auth/no-active-confirmation',
      });
    });

    it('throw si le verificationId ne match pas la confirmation en cours', async () => {
      mockSignInWithPhoneNumber().mockResolvedValueOnce({
        verificationId: 'vid-real',
        confirm: jest.fn(),
      });
      await firebaseAuthService.sendVerificationCode('+221701234567');

      await expect(
        firebaseAuthService.confirmVerificationCode('vid-WRONG', '123456'),
      ).rejects.toMatchObject({ code: 'auth/no-active-confirmation' });
    });

    it('echange OTP -> idToken et reset l\'etat', async () => {
      const confirm = jest.fn().mockResolvedValueOnce({
        user: { getIdToken: jest.fn().mockResolvedValue('firebase-id-token-xyz') },
      });
      mockSignInWithPhoneNumber().mockResolvedValueOnce({
        verificationId: 'vid-good',
        confirm,
      });
      await firebaseAuthService.sendVerificationCode('+221701234567');

      const idToken = await firebaseAuthService.confirmVerificationCode('vid-good', '123456');

      expect(confirm).toHaveBeenCalledWith('123456');
      expect(idToken).toBe('firebase-id-token-xyz');

      // L'etat est reset : un 2e appel echoue
      await expect(
        firebaseAuthService.confirmVerificationCode('vid-good', '123456'),
      ).rejects.toMatchObject({ code: 'auth/no-active-confirmation' });
    });

    it('mappe auth/invalid-verification-code en cas de mauvais OTP', async () => {
      const confirm = jest.fn().mockRejectedValueOnce({
        code: 'auth/invalid-verification-code',
      });
      mockSignInWithPhoneNumber().mockResolvedValueOnce({
        verificationId: 'vid-ok',
        confirm,
      });
      await firebaseAuthService.sendVerificationCode('+221701234567');

      await expect(
        firebaseAuthService.confirmVerificationCode('vid-ok', '000000'),
      ).rejects.toMatchObject({
        code: 'auth/invalid-verification-code',
        message: 'Code OTP incorrect.',
      });
    });

    it('throw clair si l\'objet user est manquant apres confirm', async () => {
      const confirm = jest.fn().mockResolvedValueOnce({});
      mockSignInWithPhoneNumber().mockResolvedValueOnce({
        verificationId: 'vid-empty',
        confirm,
      });
      await firebaseAuthService.sendVerificationCode('+221701234567');

      await expect(
        firebaseAuthService.confirmVerificationCode('vid-empty', '123456'),
      ).rejects.toMatchObject({ code: 'auth/empty-credential' });
    });
  });
});
