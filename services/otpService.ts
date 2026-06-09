/**
 * OTP service — backend-driven WhatsApp OTP via Twilio Verify.
 *
 * The backend sends the 6-digit code on WhatsApp when /auth/send-otp,
 * /auth/register, or /auth/password/request-reset is called.
 * This service owns the error type and the dev-bypass contract.
 *
 * ─── DEV BYPASS ─────────────────────────────────────────────────────────────
 * Quand `EXPO_PUBLIC_BYPASS_OTP === 'true'` (typiquement dans `.env.local`),
 * le backend stocke le code fixe `000000` en cache Redis au lieu d'envoyer
 * sur WhatsApp. Côté mobile, `validateCode` accepte uniquement ce code mock.
 * À combiner avec `TWILIO_BYPASS_OTP=true` côté backend.
 * Ne JAMAIS activer ce flag en production.
 */

export class OtpError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'OtpError';
  }
}

const BYPASS_OTP = process.env.EXPO_PUBLIC_BYPASS_OTP === 'true';
const MOCK_CODE = '000000';

export const otpService = {
  /**
   * In bypass mode: logs a reminder that the mock code is 000000.
   * In production: no-op (the backend already sent the WhatsApp message
   * when it received the preceding register / request-reset / send-otp call).
   */
  acknowledgeOtpSent(phone: string): void {
    if (BYPASS_OTP) {
      console.log(
        `\n[OTP BYPASS] Code WhatsApp pour ${phone} : ${MOCK_CODE}\n` +
        `             (EXPO_PUBLIC_BYPASS_OTP=true + TWILIO_BYPASS_OTP=true, ne pas activer en prod)\n`,
      );
    }
  },

  /**
   * In bypass mode: throws OtpError if the code is not the mock code.
   * In production: pass-through — backend validation via Twilio Verify is authoritative.
   */
  validateCode(code: string): string {
    if (BYPASS_OTP && code !== MOCK_CODE) {
      throw new OtpError('Code OTP incorrect. En mode bypass, utilise 000000.', 'otp/invalid-code');
    }
    return code;
  },
};
