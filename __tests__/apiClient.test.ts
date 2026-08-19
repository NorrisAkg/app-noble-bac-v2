import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import apiClient, {
  performRefresh,
  registerAuthCleanup,
  resetRefreshStateForTests,
  setApiTokens,
} from '../services/apiClient';

const mockedSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

/**
 * Stockage simulé, plutôt qu'une file de `mockResolvedValueOnce`.
 *
 * Les tests de concurrence lancent plusieurs requêtes en parallèle : l'ordre
 * dans lequel elles lisent SecureStore n'est pas déterministe, et une file
 * ordonnée rendrait le test faussement rouge.
 */
function mockSecureStore(initial: Record<string, string>): Record<string, string> {
  const store: Record<string, string> = { ...initial };

  mockedSecureStore.getItemAsync.mockImplementation(async (key: string) => store[key] ?? null);
  mockedSecureStore.setItemAsync.mockImplementation(async (key: string, value: string) => {
    store[key] = value;
  });
  mockedSecureStore.deleteItemAsync.mockImplementation(async (key: string) => {
    delete store[key];
  });

  return store;
}

/** Erreur au format axios, telle que la produit un adaptateur qui répond 401. */
function unauthorized(config: any) {
  const err: any = new Error('Unauthorized');
  err.response = { status: 401, data: {}, headers: {}, config, statusText: 'Unauthorized' };
  err.config = config;
  err.isAxiosError = true;
  return err;
}

describe('apiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    resetRefreshStateForTests();
  });

  describe('performRefresh', () => {
    it('reports an invalid session when no refresh_token is stored', async () => {
      mockedSecureStore.getItemAsync.mockResolvedValueOnce(null);

      await expect(performRefresh()).resolves.toEqual({ status: 'invalid' });
      expect(mockedSecureStore.setItemAsync).not.toHaveBeenCalled();
    });

    it('returns the new access_token and rotates both tokens on success', async () => {
      mockSecureStore({ refresh_token: 'refresh-old' });
      const postSpy = jest.spyOn(axios, 'post').mockResolvedValueOnce({
        data: {
          success: true,
          message: 'OK',
          data: {
            user: { id: 1 },
            access_token: 'access-new',
            refresh_token: 'refresh-new',
            expires_at: '2026-12-31T00:00:00Z',
          },
        },
      } as any);

      await expect(performRefresh()).resolves.toEqual({
        status: 'renewed',
        accessToken: 'access-new',
      });
      expect(postSpy).toHaveBeenCalledWith(
        expect.stringContaining('/auth/refresh'),
        { refresh_token: 'refresh-old' },
        expect.any(Object),
      );
      expect(mockedSecureStore.setItemAsync).toHaveBeenCalledWith('access_token', 'access-new');
      expect(mockedSecureStore.setItemAsync).toHaveBeenCalledWith('refresh_token', 'refresh-new');
    });

    it('treats a network failure as transient, not as an expired session', async () => {
      mockSecureStore({ refresh_token: 'refresh-old' });
      jest.spyOn(axios, 'post').mockRejectedValueOnce(new Error('Network Error'));

      await expect(performRefresh()).resolves.toEqual({
        status: 'unavailable',
        httpStatus: undefined,
      });
      expect(mockedSecureStore.setItemAsync).not.toHaveBeenCalled();
    });

    it('treats a 5xx as transient', async () => {
      mockSecureStore({ refresh_token: 'refresh-old' });
      jest.spyOn(axios, 'post').mockRejectedValueOnce(
        Object.assign(new Error('Server Error'), {
          response: { status: 500 },
          isAxiosError: true,
        }),
      );

      await expect(performRefresh()).resolves.toEqual({
        status: 'unavailable',
        httpStatus: 500,
      });
    });

    it('treats a malformed payload as transient', async () => {
      mockSecureStore({ refresh_token: 'refresh-old' });
      jest.spyOn(axios, 'post').mockResolvedValueOnce({ status: 200, data: { data: {} } } as any);

      await expect(performRefresh()).resolves.toEqual({
        status: 'unavailable',
        httpStatus: 200,
      });
    });

    it('reports an invalid session when the server rejects the refresh token', async () => {
      mockSecureStore({ refresh_token: 'refresh-old' });
      jest.spyOn(axios, 'post').mockRejectedValueOnce(
        Object.assign(new Error('Unauthorized'), {
          response: { status: 401 },
          isAxiosError: true,
        }),
      );

      await expect(performRefresh()).resolves.toEqual({ status: 'invalid', httpStatus: 401 });
    });
  });

  describe('401 interceptor flow', () => {
    let originalAdapter: any;

    beforeEach(() => {
      originalAdapter = apiClient.defaults.adapter;
    });

    afterEach(() => {
      apiClient.defaults.adapter = originalAdapter;
      registerAuthCleanup(() => undefined);
    });

    it('on 401, refreshes once and retries the original request with the new token', async () => {
      mockSecureStore({ access_token: 'access-old', refresh_token: 'refresh-old' });
      jest.spyOn(axios, 'post').mockResolvedValueOnce({
        status: 200,
        data: { data: { access_token: 'access-new', refresh_token: 'refresh-new' } },
      } as any);

      let callCount = 0;
      apiClient.defaults.adapter = jest.fn(async (config: any) => {
        callCount += 1;
        if (callCount === 1) {
          throw unauthorized(config);
        }
        // Retry: succeeds, echoes the Authorization header
        return {
          data: { ok: true, sentAuth: config.headers.get('Authorization') },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        };
      }) as any;

      const response = await apiClient.get('/protected/resource');

      expect(response.data.ok).toBe(true);
      expect(response.data.sentAuth).toBe('Bearer access-new');
      expect(callCount).toBe(2);
    });

    it('on 401 with a rejected refresh token, clears storage and notifies the cleanup hook', async () => {
      mockSecureStore({ access_token: 'access-old' }); // pas de refresh_token
      const cleanup = jest.fn();
      registerAuthCleanup(cleanup);

      apiClient.defaults.adapter = jest.fn(async (config: any) => {
        throw unauthorized(config);
      }) as any;

      await expect(apiClient.get('/protected/resource')).rejects.toBeDefined();

      expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith('access_token');
      expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith('refresh_token');
      expect(cleanup).toHaveBeenCalledTimes(1);
    });

    /**
     * Le cas qui renvoyait l'utilisateur sur le landing au moindre trou de
     * réseau : le rafraîchissement échoue sans que le serveur ait rien dit de
     * la session, elle doit donc rester intacte.
     */
    it('leaves the session intact when the refresh call fails on the network', async () => {
      mockSecureStore({ access_token: 'access-old', refresh_token: 'refresh-old' });
      jest.spyOn(axios, 'post').mockRejectedValueOnce(new Error('Network Error'));

      const cleanup = jest.fn();
      registerAuthCleanup(cleanup);

      apiClient.defaults.adapter = jest.fn(async (config: any) => {
        throw unauthorized(config);
      }) as any;

      await expect(apiClient.get('/protected/resource')).rejects.toBeDefined();

      expect(cleanup).not.toHaveBeenCalled();
      expect(mockedSecureStore.deleteItemAsync).not.toHaveBeenCalled();
    });

    it('refreshes only once when several requests get a 401 at the same time', async () => {
      mockSecureStore({ access_token: 'access-old', refresh_token: 'refresh-old' });
      const postSpy = jest.spyOn(axios, 'post').mockResolvedValue({
        status: 200,
        data: { data: { access_token: 'access-new', refresh_token: 'refresh-new' } },
      } as any);

      const seen = new Set<string>();
      apiClient.defaults.adapter = jest.fn(async (config: any) => {
        // Chaque URL échoue une fois, puis réussit — c'est la rafale de
        // requêtes que l'entrée dans les onglets déclenche.
        if (!seen.has(config.url)) {
          seen.add(config.url);
          throw unauthorized(config);
        }
        return {
          data: { sentAuth: config.headers.get('Authorization') },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        };
      }) as any;

      const responses = await Promise.all([
        apiClient.get('/a'),
        apiClient.get('/b'),
        apiClient.get('/c'),
      ]);

      expect(postSpy).toHaveBeenCalledTimes(1);
      for (const response of responses) {
        expect(response.data.sentAuth).toBe('Bearer access-new');
      }
    });

    /**
     * La seconde rotation était la déconnexion : le refresh token est à usage
     * unique, rejouer le jti déjà consommé se solde par un 401 sur
     * /auth/refresh, donc par un effacement de session.
     */
    it('replays a late 401 with the current token instead of rotating twice', async () => {
      mockSecureStore({ access_token: 'access-old', refresh_token: 'refresh-old' });
      const postSpy = jest.spyOn(axios, 'post').mockResolvedValueOnce({
        status: 200,
        data: { data: { access_token: 'access-new', refresh_token: 'refresh-new' } },
      } as any);

      const cleanup = jest.fn();
      registerAuthCleanup(cleanup);

      const seen = new Set<string>();
      apiClient.defaults.adapter = jest.fn(async (config: any) => {
        if (!seen.has(config.url)) {
          seen.add(config.url);
          throw unauthorized(config);
        }
        return {
          data: { sentAuth: config.headers.get('Authorization') },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        };
      }) as any;

      // Première requête : rotation complète.
      await apiClient.get('/first');
      expect(postSpy).toHaveBeenCalledTimes(1);

      // Requête partie avant la rotation, qui revient en 401 juste après.
      const late = await apiClient.get('/late');

      expect(postSpy).toHaveBeenCalledTimes(1); // aucune seconde rotation
      expect(late.data.sentAuth).toBe('Bearer access-new');
      expect(cleanup).not.toHaveBeenCalled();
    });

    /**
     * La course qui écrasait la session Google : les requêtes relancées au
     * retour du sélecteur de compte partaient SANS token (aucune session), le
     * 401 déclenchait refresh → invalid → purge + clearLocal, dont le détour
     * par le SDK Google finissait après setAuth et détruisait la session
     * fraîchement ouverte. Sans session, un 401 pré-auth doit être rejeté tel
     * quel : rien à rafraîchir, rien à nettoyer.
     */
    it('rejects a pre-auth 401 without touching storage when no session exists', async () => {
      mockSecureStore({}); // aucune session : ni access ni refresh token
      const postSpy = jest.spyOn(axios, 'post');
      const cleanup = jest.fn();
      registerAuthCleanup(cleanup);

      apiClient.defaults.adapter = jest.fn(async (config: any) => {
        throw unauthorized(config);
      }) as any;

      await expect(apiClient.get('/protected/resource')).rejects.toBeDefined();

      expect(postSpy).not.toHaveBeenCalled(); // pas de tentative de refresh
      expect(cleanup).not.toHaveBeenCalled();
      expect(mockedSecureStore.deleteItemAsync).not.toHaveBeenCalled();
    });

    /**
     * Second volet de la même course : la purge est décidée (refresh invalid)
     * pendant qu'une NOUVELLE session s'ouvre. Le verdict porte sur l'ancienne
     * session — la requête doit être rejouée avec le token courant, jamais
     * purger la session qui vient de s'ouvrir.
     */
    it('replays instead of purging when a new session opened during the refresh', async () => {
      mockSecureStore({ access_token: 'access-old', refresh_token: 'refresh-old' });
      const cleanup = jest.fn();
      registerAuthCleanup(cleanup);

      // Le refresh est rejeté en 401 (session ancienne morte)… mais pendant
      // l'aller-retour, setAuth a ouvert une nouvelle session.
      jest.spyOn(axios, 'post').mockImplementationOnce(async () => {
        setApiTokens({ accessToken: 'access-nouvelle-session', refreshToken: 'refresh-nouvelle-session' });
        throw Object.assign(new Error('Unauthorized'), {
          response: { status: 401 },
          isAxiosError: true,
        });
      });

      const seen = new Set<string>();
      apiClient.defaults.adapter = jest.fn(async (config: any) => {
        if (!seen.has(config.url)) {
          seen.add(config.url);
          throw unauthorized(config);
        }
        return {
          data: { sentAuth: config.headers.get('Authorization') },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        };
      }) as any;

      const response = await apiClient.get('/protected/resource');

      expect(response.data.sentAuth).toBe('Bearer access-nouvelle-session');
      expect(cleanup).not.toHaveBeenCalled();
      expect(mockedSecureStore.deleteItemAsync).not.toHaveBeenCalled();
    });
  });
});
