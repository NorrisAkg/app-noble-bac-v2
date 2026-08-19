import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
  isAxiosError,
} from 'axios';
import * as SecureStore from 'expo-secure-store';

import { traceAuth } from './authTrace';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost/api/v1',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

// ─── Auth-failure hook ────────────────────────────────────────────────────────
//
// The auth store registers a `clearLocal` callback at boot. We call it when a
// refresh attempt fails so the store can drop its in-memory state.
// Keep this as a module-level slot to avoid importing the store from here
// (which would create a circular dependency through authService).
//
let onAuthFailure: (() => Promise<void> | void) | null = null;

export function registerAuthCleanup(fn: () => Promise<void> | void): void {
  onAuthFailure = fn;
}

let cachedAccessToken: string | null = null;
let cachedRefreshToken: string | null = null;
let lastAuthAt = 0;

export function setApiTokens(tokens: {
  accessToken: string | null;
  refreshToken?: string | null;
}): void {
  cachedAccessToken = tokens.accessToken;
  if (tokens.refreshToken !== undefined) {
    cachedRefreshToken = tokens.refreshToken;
  }
  if (tokens.accessToken) {
    lastAuthAt = Date.now();
  }
}

// ─── Request interceptor ──────────────────────────────────────────────────────
apiClient.interceptors.request.use(async (config) => {
  const token = cachedAccessToken ?? (await SecureStore.getItemAsync(ACCESS_TOKEN_KEY));
  (config as any)._sentAt = Date.now();
  (config as any)._token = token;
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

// ─── Refresh primitives ───────────────────────────────────────────────────────
//
// Single-flight refresh: when N requests fail with 401 in parallel we want
// ONE refresh call to be made and all N retries to wait on it.
//
let refreshInFlight: Promise<RefreshOutcome> | null = null;

/**
 * Date du dernier rafraîchissement réussi. Sert à reconnaître les 401 qui
 * suivent une rotation — voir la fenêtre ci-dessous.
 */
let lastRefreshAt = 0;

/**
 * Après une rotation réussie, toutes les requêtes déjà en vol portent encore
 * l'ancien access token et vont revenir en 401. Pendant cette fenêtre, un 401
 * se rejoue avec le token courant SANS relancer de rotation : le refresh token
 * est à usage unique côté serveur, une seconde rotation présenterait un jti
 * déjà consommé, se ferait rejeter, et déconnecterait l'utilisateur alors que
 * sa session est parfaitement valide.
 */
const POST_REFRESH_GRACE_MS = 10_000;

/**
 * Issue d'une tentative de rafraîchissement.
 *
 * La distinction `invalid` / `unavailable` est le cœur du contrat : seule une
 * session dont le serveur a dit qu'elle est morte justifie d'effacer les
 * tokens. Une coupure réseau ou un 500 sont transitoires — les traiter comme
 * une session expirée déconnectait l'utilisateur au premier trou de couverture.
 */
export type RefreshOutcome =
  | { status: 'renewed'; accessToken: string }
  | { status: 'invalid'; httpStatus?: number }
  | { status: 'unavailable'; httpStatus?: number };

/**
 * Calls POST /auth/refresh with the stored refresh_token.
 * Uses a bare axios call (not apiClient) so the request itself is not
 * intercepted, which would trigger an infinite loop on its own 401.
 *
 * On success, updates SecureStore with the rotated tokens.
 */
/**
 * Remet à zéro le verrou single-flight et la fenêtre de grâce.
 *
 * Réservé aux tests : ces deux variables vivent au niveau du module, donc un
 * test qui rafraîchit avec succès ferait basculer le suivant dans la fenêtre
 * de grâce sans que celui-ci l'ait demandé.
 */
export function resetRefreshStateForTests(): void {
  refreshInFlight = null;
  lastRefreshAt = 0;
  lastAuthAt = 0;
  cachedAccessToken = null;
  cachedRefreshToken = null;
}

export async function performRefresh(): Promise<RefreshOutcome> {
  const refreshToken = cachedRefreshToken ?? (await SecureStore.getItemAsync(REFRESH_TOKEN_KEY));
  // Rien à présenter : la session est bel et bien inexploitable.
  if (!refreshToken) return { status: 'invalid' };

  try {
    const baseURL = apiClient.defaults.baseURL ?? '';
    const response = await axios.post(
      `${baseURL}/auth/refresh`,
      { refresh_token: refreshToken },
      { headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'ngrok-skip-browser-warning': 'true' } },
    );
    const tokens = response.data?.data;
    if (!tokens?.access_token || !tokens?.refresh_token) {
      // 2xx au corps inexploitable : anomalie serveur, pas une preuve que la
      // session est expirée. On ne déconnecte pas là-dessus.
      return { status: 'unavailable', httpStatus: response.status };
    }
    cachedAccessToken = tokens.access_token as string;
    cachedRefreshToken = tokens.refresh_token as string;
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.access_token);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refresh_token);
    lastRefreshAt = Date.now();
    return { status: 'renewed', accessToken: tokens.access_token as string };
  } catch (error) {
    const httpStatus = isAxiosError(error) ? error.response?.status : undefined;

    // Seul le serveur peut déclarer la session morte. Tout le reste — pas de
    // réponse du tout, timeout, 5xx, 429 — est transitoire.
    if (httpStatus === 401 || httpStatus === 403) {
      return { status: 'invalid', httpStatus };
    }

    return { status: 'unavailable', httpStatus };
  }
}

// ─── Response interceptor: 401 → refresh-once → retry ─────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (error.response?.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // Never try to refresh the refresh endpoint itself.
    if (originalRequest.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // Requête partie AVANT l'ouverture de la session courante ou portant un
    // token obsolète : on la rejoue avec le token de session actuel plutôt que
    // de purger la session.
    const requestToken = (originalRequest as any)._token;
    const requestSentAt = (originalRequest as any)._sentAt;

    if (cachedAccessToken && (
      requestToken !== cachedAccessToken ||
      (requestSentAt && lastAuthAt && requestSentAt < lastAuthAt)
    )) {
      traceAuth(`401 sur requête pré-authentification ${originalRequest.url} — rejouée avec le token de session`);
      originalRequest.headers.set('Authorization', `Bearer ${cachedAccessToken}`);
      return apiClient(originalRequest);
    }

    // Requête partie sans token alors qu'aucune session n'existe en mémoire :
    // il n'y a rien à rafraîchir ni à nettoyer. Tenter le refresh ici finissait
    // en `invalid` (pas de refresh token) → purge + clearLocal → oubli du
    // compte Google… pendant que « Continuer avec Google » était justement en
    // train d'ouvrir une session. Cas typique : les requêtes relancées par le
    // focus au retour du sélecteur de compte Google. On rejette, point.
    if (!requestToken && !cachedAccessToken) {
      traceAuth(
        `401 sur ${originalRequest.url} — aucune session (requête pré-auth), rejeté sans purge`,
      );
      return Promise.reject(error);
    }

    // Requête partie avant une rotation qui vient d'aboutir : elle portait
    // l'ancien token, pas la preuve d'une session morte. On la rejoue avec le
    // token courant plutôt que de relancer une rotation qui échouerait.
    if (!refreshInFlight && Date.now() - lastRefreshAt < POST_REFRESH_GRACE_MS) {
      const currentToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      if (currentToken) {
        originalRequest.headers.set('Authorization', `Bearer ${currentToken}`);
        return apiClient(originalRequest);
      }
    }

    if (!refreshInFlight) {
      refreshInFlight = performRefresh().finally(() => {
        refreshInFlight = null;
      });
    }

    const outcome = await refreshInFlight;

    if (outcome.status === 'renewed') {
      traceAuth(`401 sur ${originalRequest.url} — tokens renouvelés, requête rejouée`);
      originalRequest.headers.set('Authorization', `Bearer ${outcome.accessToken}`);
      return apiClient(originalRequest);
    }

    if (outcome.status === 'unavailable') {
      // Panne passagère : on rend la main à l'appelant (react-query réessaiera,
      // le bandeau hors-ligne s'affiche) en laissant la session intacte.
      traceAuth(
        `401 sur ${originalRequest.url} — refresh indisponible (${outcome.httpStatus ?? 'aucune réponse'}), session gardée`,
      );
      return Promise.reject(error);
    }

    // Dernier contrôle avant la purge : si une session PLUS RÉCENTE s'est
    // ouverte pendant le refresh (setAuth a rempli le cache avec un autre
    // token que celui de la requête), le verdict `invalid` ne la concerne
    // pas — il porte sur l'ancienne session. On rejoue avec le token courant
    // au lieu d'effacer une session parfaitement valide.
    if (cachedAccessToken && cachedAccessToken !== requestToken) {
      traceAuth(
        `401 sur ${originalRequest.url} — refresh invalide mais une nouvelle session est ouverte, requête rejouée sans purge`,
      );
      originalRequest.headers.set('Authorization', `Bearer ${cachedAccessToken}`);
      return apiClient(originalRequest);
    }

    // Session réellement refusée par le serveur : c'est la seule issue qui
    // autorise à effacer les tokens. La trace nomme la requête déclenchante —
    // sans elle, une déconnexion en production est indiscernable d'un
    // redémarrage à froid. Aucun token ni corps de réponse n'est journalisé.
    traceAuth(
      `SESSION EFFACÉE : 401 sur ${originalRequest.url} — ` +
        `/auth/refresh a répondu ${outcome.httpStatus ?? 'aucune réponse'}`,
    );

    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    if (onAuthFailure) {
      try {
        await onAuthFailure();
      } catch {
        // Silent: don't shadow the original 401.
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
