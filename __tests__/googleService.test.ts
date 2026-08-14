/**
 * Le module natif n'existe pas sous Jest : on remplace le SDK en entier. Le
 * service importe `GoogleSignin`, `statusCodes` et `isErrorWithCode` — les
 * trois doivent etre fournis, sinon l'import du service echoue au chargement.
 */
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn().mockResolvedValue(true),
    signIn: jest.fn(),
    signOut: jest.fn().mockResolvedValue(null),
    revokeAccess: jest.fn().mockResolvedValue(null),
    getCurrentUser: jest.fn().mockReturnValue(null),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    DEVELOPER_ERROR: 'DEVELOPER_ERROR',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
    SIGN_IN_REQUIRED: 'SIGN_IN_REQUIRED',
  },
  isErrorWithCode: (e: unknown): boolean =>
    typeof e === 'object' && e !== null && 'code' in e,
}));

import { GoogleSignin } from '@react-native-google-signin/google-signin';

import {
  forgetGoogleAccount,
  formatGoogleErrorMessage,
  signInWithGoogle,
} from '../services/googleService';

const mockedGoogleSignin = GoogleSignin as jest.Mocked<typeof GoogleSignin>;

describe('signInWithGoogle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = 'test-web-client-id';
    mockedGoogleSignin.signIn.mockResolvedValue({
      type: 'success',
      data: { idToken: 'id-token' },
    } as never);
  });

  it('révoque le compte encore en cache avant d\'ouvrir la fenêtre', async () => {
    mockedGoogleSignin.getCurrentUser.mockReturnValueOnce({ user: {} } as never);

    await expect(signInWithGoogle()).resolves.toBe('id-token');

    expect(mockedGoogleSignin.revokeAccess).toHaveBeenCalledTimes(1);
    expect(mockedGoogleSignin.revokeAccess.mock.invocationCallOrder[0]).toBeLessThan(
      mockedGoogleSignin.signIn.mock.invocationCallOrder[0],
    );
  });

  it('purge la session native avant d\'ouvrir la fenêtre pour forcer le sélecteur de compte', async () => {
    mockedGoogleSignin.getCurrentUser.mockReturnValueOnce(null);

    await expect(signInWithGoogle()).resolves.toBe('id-token');

    expect(mockedGoogleSignin.revokeAccess).not.toHaveBeenCalled();
    expect(mockedGoogleSignin.signOut).toHaveBeenCalledTimes(1);
  });
});

describe('formatGoogleErrorMessage', () => {
  it('formate explicitement le code DEVELOPER_ERROR', () => {
    const error = { code: 'DEVELOPER_ERROR', message: 'developer error' };
    expect(formatGoogleErrorMessage(error)).toContain('code 10');
    expect(formatGoogleErrorMessage(error)).toContain('SHA-1');
  });

  it('formate explicitement le code PLAY_SERVICES_NOT_AVAILABLE', () => {
    const error = { code: 'PLAY_SERVICES_NOT_AVAILABLE', message: 'play services error' };
    expect(formatGoogleErrorMessage(error)).toContain('Google Play');
  });
});

describe('forgetGoogleAccount', () => {
  const previousClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = 'test-web-client-id';
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = previousClientId;
  });

  it('révoque l\'autorisation Google avant de vider le cache local', async () => {
    await forgetGoogleAccount();

    expect(mockedGoogleSignin.revokeAccess).toHaveBeenCalledTimes(1);
    expect(mockedGoogleSignin.signOut).toHaveBeenCalledTimes(1);
    expect(mockedGoogleSignin.revokeAccess.mock.invocationCallOrder[0]).toBeLessThan(
      mockedGoogleSignin.signOut.mock.invocationCallOrder[0],
    );
  });

  it('vide quand même le cache local si la révocation échoue', async () => {
    mockedGoogleSignin.revokeAccess.mockRejectedValueOnce(new Error('SIGN_IN_REQUIRED'));

    await expect(forgetGoogleAccount()).resolves.toBeUndefined();

    expect(mockedGoogleSignin.signOut).toHaveBeenCalledTimes(1);
  });

  it('n\'attend pas indéfiniment un appel au SDK qui ne répond pas', async () => {
    jest.useFakeTimers();
    mockedGoogleSignin.revokeAccess.mockReturnValueOnce(new Promise(() => {}) as never);

    const pending = forgetGoogleAccount();
    await jest.advanceTimersByTimeAsync(5_000);

    await expect(pending).resolves.toBeUndefined();
    jest.useRealTimers();
  });

  it('ne rejette jamais, même si les deux appels échouent', async () => {
    mockedGoogleSignin.revokeAccess.mockRejectedValueOnce(new Error('boom'));
    mockedGoogleSignin.signOut.mockRejectedValueOnce(new Error('boom'));

    await expect(forgetGoogleAccount()).resolves.toBeUndefined();
  });

  it('ne rejette pas quand le client ID n\'est pas défini', async () => {
    jest.resetModules();
    delete process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const freshService = require('../services/googleService') as typeof import('../services/googleService');

    await expect(freshService.forgetGoogleAccount()).resolves.toBeUndefined();
  });
});
