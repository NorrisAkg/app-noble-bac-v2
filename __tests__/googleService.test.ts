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
  },
  statusCodes: { SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED' },
  isErrorWithCode: (e: unknown): boolean =>
    typeof e === 'object' && e !== null && 'code' in e,
}));

import { GoogleSignin } from '@react-native-google-signin/google-signin';

import { forgetGoogleAccount } from '../services/googleService';

const mockedGoogleSignin = GoogleSignin as jest.Mocked<typeof GoogleSignin>;

describe('forgetGoogleAccount', () => {
  const previousClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = 'test-web-client-id';
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = previousClientId;
  });

  /**
   * signOut() seul ne vide que le cache local : l'autorisation OAuth survit et
   * le signIn() suivant la re-honore en silence, sans sélecteur de compte.
   * C'est revokeAccess() qui rend le sélecteur.
   */
  it('révoque l\'autorisation Google avant de vider le cache local', async () => {
    await forgetGoogleAccount();

    expect(mockedGoogleSignin.revokeAccess).toHaveBeenCalledTimes(1);
    expect(mockedGoogleSignin.signOut).toHaveBeenCalledTimes(1);
    expect(mockedGoogleSignin.revokeAccess.mock.invocationCallOrder[0]).toBeLessThan(
      mockedGoogleSignin.signOut.mock.invocationCallOrder[0],
    );
  });

  /**
   * revokeAccess() rejette des qu'aucun compte n'est connecte cote SDK — le cas
   * de tout utilisateur inscrit par telephone. Le nettoyage local doit quand
   * meme avoir lieu.
   */
  it('vide quand même le cache local si la révocation échoue', async () => {
    mockedGoogleSignin.revokeAccess.mockRejectedValueOnce(new Error('SIGN_IN_REQUIRED'));

    await expect(forgetGoogleAccount()).resolves.toBeUndefined();

    expect(mockedGoogleSignin.signOut).toHaveBeenCalledTimes(1);
  });

  /**
   * clearLocal est le passage oblige de toutes les fins de session, y compris
   * celle que declenche un 401. Un appel au SDK qui traine ne doit pas y bloquer
   * l'effacement de la session.
   */
  it('n\'attend pas indéfiniment un appel au SDK qui ne répond pas', async () => {
    jest.useFakeTimers();
    mockedGoogleSignin.revokeAccess.mockReturnValueOnce(new Promise(() => {}) as never);

    const pending = forgetGoogleAccount();
    await jest.advanceTimersByTimeAsync(5_000);

    await expect(pending).resolves.toBeUndefined();
    jest.useRealTimers();
  });

  /** Appelée depuis clearLocal : elle ne doit jamais faire échouer une fin de session. */
  it('ne rejette jamais, même si les deux appels échouent', async () => {
    mockedGoogleSignin.revokeAccess.mockRejectedValueOnce(new Error('boom'));
    mockedGoogleSignin.signOut.mockRejectedValueOnce(new Error('boom'));

    await expect(forgetGoogleAccount()).resolves.toBeUndefined();
  });

  /**
   * `configure()` leve quand la variable d'environnement manque. Cette
   * exception ne doit pas remonter : une deconnexion ne peut pas dependre de la
   * configuration du SDK Google.
   */
  it('ne rejette pas quand le client ID n\'est pas défini', async () => {
    jest.resetModules();
    delete process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

    // Re-import apres reset : `isConfigured` vit au niveau du module et a deja
    // ete positionne par les cas precedents. `require` et non `import()`, que
    // Jest ne sait pas resoudre dynamiquement sans --experimental-vm-modules.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const freshService = require('../services/googleService') as typeof import('../services/googleService');

    await expect(freshService.forgetGoogleAccount()).resolves.toBeUndefined();
  });
});
