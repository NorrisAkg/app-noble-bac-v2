import { otpService, OtpError } from '../services/otpService';

describe('otpService', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.resetModules();
  });

  describe('bypass mode (EXPO_PUBLIC_BYPASS_OTP=true)', () => {
    let bypassService: typeof otpService;
    let BypassOtpError: typeof OtpError;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv, EXPO_PUBLIC_BYPASS_OTP: 'true' };
      const mod = require('../services/otpService') as typeof import('../services/otpService');
      bypassService = mod.otpService;
      BypassOtpError = mod.OtpError;
    });

    it('validateCode accepts 000000 (mock code)', () => {
      expect(bypassService.validateCode('000000')).toBe('000000');
    });

    it('validateCode throws OtpError for any other code', () => {
      expect(() => bypassService.validateCode('123456')).toThrow(BypassOtpError);
      expect(() => bypassService.validateCode('123456')).toThrow(
        'Code OTP incorrect. En mode bypass, utilise 000000.',
      );
    });

    it('validateCode throws OtpError with code otp/invalid-code', () => {
      try {
        bypassService.validateCode('999999');
        throw new Error('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(BypassOtpError);
        expect((e as OtpError).code).toBe('otp/invalid-code');
      }
    });

    it('acknowledgeOtpSent logs a bypass reminder (console.log called)', () => {
      const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
      bypassService.acknowledgeOtpSent('+22590000000');
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0]).toContain('OTP BYPASS');
      expect(spy.mock.calls[0][0]).toContain('000000');
      spy.mockRestore();
    });
  });

  describe('production mode (EXPO_PUBLIC_BYPASS_OTP not set)', () => {
    let prodService: typeof otpService;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
      delete process.env.EXPO_PUBLIC_BYPASS_OTP;
      const mod = require('../services/otpService') as typeof import('../services/otpService');
      prodService = mod.otpService;
    });

    it('validateCode is a pass-through for any code', () => {
      expect(prodService.validateCode('123456')).toBe('123456');
      expect(prodService.validateCode('000000')).toBe('000000');
      expect(prodService.validateCode('999999')).toBe('999999');
    });

    it('acknowledgeOtpSent is a no-op (console.log not called)', () => {
      const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
      prodService.acknowledgeOtpSent('+22590000000');
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('OtpError', () => {
    it('has name OtpError and is instanceof Error', () => {
      const err = new OtpError('some message', 'otp/invalid-code');
      expect(err).toBeInstanceOf(Error);
      expect(err.name).toBe('OtpError');
      expect(err.message).toBe('some message');
      expect(err.code).toBe('otp/invalid-code');
    });

    it('code is optional', () => {
      const err = new OtpError('msg only');
      expect(err.code).toBeUndefined();
    });
  });
});
