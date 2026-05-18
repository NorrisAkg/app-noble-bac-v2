/**
 * Firebase Phone Auth — on-device OTP wrapper.
 *
 * Status: STUB. Real implementation is scheduled for M-P1.1 (see
 * mobile/.claude/PLAN.md). Until then, both methods throw a typed
 * error so callers can render a clear "Firebase not yet integrated"
 * banner instead of silently failing.
 *
 * Contract (frozen for the real implementation):
 *   - sendVerificationCode(phone): triggers a Firebase Auth phone-number
 *     verification. Returns an opaque verificationId that the caller must
 *     pass back to confirmVerificationCode together with the OTP entered
 *     by the user.
 *   - confirmVerificationCode(verificationId, code): exchanges the OTP
 *     for a Firebase ID Token. That token is what the backend expects in
 *     `id_token` for /auth/verify-otp and /auth/password/reset.
 */
export class FirebaseNotConfiguredError extends Error {
  constructor(message = 'Firebase Phone Auth not yet integrated (planned in M-P1.1).') {
    super(message);
    this.name = 'FirebaseNotConfiguredError';
  }
}

export const firebaseAuthService = {
  async sendVerificationCode(_phone: string): Promise<string> {
    throw new FirebaseNotConfiguredError();
  },

  async confirmVerificationCode(_verificationId: string, _code: string): Promise<string> {
    throw new FirebaseNotConfiguredError();
  },
};
