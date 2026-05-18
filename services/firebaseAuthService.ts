import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

/**
 * Firebase Phone Auth — on-device OTP wrapper.
 *
 * Contract:
 *   - sendVerificationCode(phone): triggers Firebase phone-number verification
 *     (SMS sent on the device's behalf). Returns an opaque verificationId
 *     that the caller passes back to confirmVerificationCode together with the
 *     OTP entered by the user.
 *   - confirmVerificationCode(verificationId, code): exchanges the OTP for a
 *     Firebase ID Token. That token is what the backend expects in `id_token`
 *     for /auth/verify-otp and /auth/password/reset.
 *
 * Internal note: @react-native-firebase exposes the `ConfirmationResult` as a
 * stateful object with a `.confirm()` method (the verificationId alone is not
 * enough to call signInWithCredential cleanly across all platforms). We keep
 * the current confirmation in module-level state and key it by verificationId
 * so the contract remains stable from the screens' point of view.
 */
export class FirebaseNotConfiguredError extends Error {
  constructor(message = 'Firebase Phone Auth not yet integrated.') {
    super(message);
    this.name = 'FirebaseNotConfiguredError';
  }
}

export class FirebaseOtpError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'FirebaseOtpError';
  }
}

let currentConfirmation: FirebaseAuthTypes.ConfirmationResult | null = null;

function mapFirebaseError(e: unknown): FirebaseOtpError {
  const error = e as { code?: string; message?: string };
  switch (error.code) {
    case 'auth/invalid-phone-number':
      return new FirebaseOtpError('Numéro de téléphone invalide.', error.code);
    case 'auth/too-many-requests':
      return new FirebaseOtpError(
        'Trop de tentatives. Reessaie dans quelques minutes.',
        error.code,
      );
    case 'auth/invalid-verification-code':
      return new FirebaseOtpError('Code OTP incorrect.', error.code);
    case 'auth/code-expired':
      return new FirebaseOtpError('Le code OTP a expiré. Demande un nouveau code.', error.code);
    case 'auth/session-expired':
      return new FirebaseOtpError('La session OTP a expiré. Demande un nouveau code.', error.code);
    case 'auth/network-request-failed':
      return new FirebaseOtpError('Pas de connexion réseau. Vérifie ta connexion.', error.code);
    default:
      return new FirebaseOtpError(
        error.message ?? 'Échec de la vérification du téléphone.',
        error.code,
      );
  }
}

export const firebaseAuthService = {
  async sendVerificationCode(phone: string): Promise<string> {
    try {
      currentConfirmation = await auth().signInWithPhoneNumber(phone);
      return currentConfirmation.verificationId ?? '';
    } catch (e) {
      throw mapFirebaseError(e);
    }
  },

  async confirmVerificationCode(verificationId: string, code: string): Promise<string> {
    if (!currentConfirmation || currentConfirmation.verificationId !== verificationId) {
      throw new FirebaseOtpError(
        'Aucune verification OTP en cours pour cet identifiant. Redemande un code.',
        'auth/no-active-confirmation',
      );
    }
    try {
      const userCredential = await currentConfirmation.confirm(code);
      if (!userCredential?.user) {
        throw new FirebaseOtpError('Échec de la vérification du code.', 'auth/empty-credential');
      }
      const idToken = await userCredential.user.getIdToken();
      currentConfirmation = null;
      return idToken;
    } catch (e) {
      if (e instanceof FirebaseOtpError) throw e;
      throw mapFirebaseError(e);
    }
  },

  /** Test helper — reset internal state between tests. */
  _resetForTesting(): void {
    currentConfirmation = null;
  },
};
