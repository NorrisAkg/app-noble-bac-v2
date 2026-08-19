import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { User } from '@/types/api';
import { setApiTokens } from '@/services/apiClient';
import { logout as apiLogout } from '@/services/authService';
import { traceAuth } from '@/services/authTrace';
import { forgetGoogleAccount } from '@/services/googleService';
import { unregisterCurrentPushToken } from '@/services/pushNotificationService';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'auth_user',
  PASSWORD_UPGRADE: 'password_upgrade_required',
} as const;

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  /**
   * Époque de session : incrémentée à CHAQUE ouverture de session (setAuth).
   * clearLocal() capture l'époque à son entrée et n'a le droit d'effacer que
   * la session qu'il a vue à ce moment-là. Si une nouvelle session s'ouvre
   * pendant qu'il attend (SecureStore, SDK Google…), l'époque a changé et le
   * nettoyage s'annule — c'est le verrou contre la course « clearLocal
   * déclenché par un 401 pré-auth écrase la session Google qui vient de
   * s'ouvrir », qui renvoyait l'utilisateur au landing ou le bloquait sur
   * /setup avec « Unauthenticated ».
   */
  sessionEpoch: number;
  /** True once initialize() has finished reading SecureStore on app boot */
  isHydrated: boolean;
  /**
   * Vrai si l'utilisateur vient de créer son compte et est en cours d'onboarding
   * (congrats -> setup). Protège la navigation contre le guard de _layout.tsx.
   */
  isNewUser: boolean;
  /**
   * Compte historique dont le mot de passe est encore un PIN à 4 chiffres.
   * Persisté : sans ça, tuer l'app suffirait à contourner la migration
   * jusqu'à la prochaine connexion.
   */
  passwordUpgradeRequired: boolean;
  /** Call after a successful login or OTP verification */
  setAuth: (
    user: User,
    accessToken: string,
    refreshToken: string,
    passwordUpgradeRequired?: boolean,
    isNewUser?: boolean,
  ) => Promise<void>;
  /** Appelé après une migration réussie du mot de passe. */
  clearPasswordUpgrade: () => Promise<void>;
  /** Revokes the token on the server then clears local storage */
  logout: () => Promise<void>;
  /** Local-only cleanup. Called by apiClient when refresh fails (no server roundtrip). */
  clearLocal: () => Promise<void>;
  /** Rehydrates auth state from SecureStore on app boot */
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isHydrated: false,
  isNewUser: false,
  passwordUpgradeRequired: false,
  sessionEpoch: 0,

  setAuth: async (
    user,
    accessToken,
    refreshToken,
    passwordUpgradeRequired = false,
    isNewUser = false,
  ) => {
    // Incrément SYNCHRONE, avant tout await : dès cet instant, tout
    // clearLocal() entré plus tôt voit une époque différente et s'annule.
    set((state) => ({ sessionEpoch: state.sessionEpoch + 1 }));
    setApiTokens({ accessToken, refreshToken });
    await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    await SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(user));
    await SecureStore.setItemAsync(
      STORAGE_KEYS.PASSWORD_UPGRADE,
      passwordUpgradeRequired ? '1' : '0',
    );
    set({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: true,
      passwordUpgradeRequired,
      isNewUser,
    });
    traceAuth('setAuth : session ouverte');
  },

  clearPasswordUpgrade: async () => {
    await SecureStore.setItemAsync(STORAGE_KEYS.PASSWORD_UPGRADE, '0');
    set({ passwordUpgradeRequired: false });
  },

  logout: async () => {
    // Best-effort push token cleanup, then server revocation — both must run
    // before clearLocal() drops the access token they rely on.
    try {
      await unregisterCurrentPushToken();
    } catch {
      // silent
    }
    try {
      await apiLogout();
    } catch {
      // silent
    }
    await get().clearLocal();
  },

  clearLocal: async () => {
    traceAuth('clearLocal : fin de session');

    // Époque capturée à l'entrée : ce nettoyage n'a le droit d'effacer QUE la
    // session visible à cet instant. Chaque étape destructive re-vérifie
    // l'époque après un await — si setAuth() a ouvert une session entre-temps,
    // on s'arrête sans rien toucher. Sans ce verrou, un clearLocal déclenché
    // par un 401 pré-auth (requêtes relancées au retour du sélecteur de compte
    // Google) écrasait la session fraîchement ouverte : tokens effacés,
    // isAuthenticated remis à false, isNewUser perdu.
    const epoch = get().sessionEpoch;
    const newerSessionOpened = (): boolean => {
      if (get().sessionEpoch === epoch) return false;
      traceAuth('clearLocal annulé : une nouvelle session a été ouverte pendant le nettoyage');
      return true;
    };

    if (newerSessionOpened()) return;
    setApiTokens({ accessToken: null, refreshToken: null });
    await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    if (newerSessionOpened()) return;
    await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    if (newerSessionOpened()) return;
    await SecureStore.deleteItemAsync(STORAGE_KEYS.USER);
    if (newerSessionOpened()) return;
    await SecureStore.deleteItemAsync(STORAGE_KEYS.PASSWORD_UPGRADE);
    if (newerSessionOpened()) return;
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isNewUser: false,
      passwordUpgradeRequired: false,
    });

    // Toutes les fins de session passent par ici : déconnexion volontaire,
    // session invalidée par le serveur (apiClient), suppression de compte. Le
    // compte Google doit être oublié dans les trois cas, sans quoi le prochain
    // « Continuer avec Google » reconnecte le même compte en silence, sans même
    // afficher le sélecteur. Fire-and-forget APRÈS le wipe : le state local
    // n'a jamais dépendu de cet aller-retour SDK (jusqu'à 2 × 4 s), et le
    // laisser bloquer clearLocal ouvrait la fenêtre de course ci-dessus.
    void forgetGoogleAccount();
  },

  initialize: async () => {
    // Build the final state in memory and commit it in a single set() so the
    // routing layer never observes an intermediate {isAuthenticated:true,
    // isHydrated:false} frame (which would race index.tsx vs the layout guard).
    let next: Partial<AuthState> = { isHydrated: true, isNewUser: false };
    try {
      const accessToken = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      const rawUser = await SecureStore.getItemAsync(STORAGE_KEYS.USER);

      if (accessToken && rawUser) {
        try {
          const user: User = JSON.parse(rawUser);
          const upgrade = await SecureStore.getItemAsync(STORAGE_KEYS.PASSWORD_UPGRADE);
          setApiTokens({ accessToken, refreshToken });
          next = {
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isHydrated: true,
            isNewUser: false,
            passwordUpgradeRequired: upgrade === '1',
          };
        } catch {
          // Corrupted storage — clear it
          setApiTokens({ accessToken: null, refreshToken: null });
          await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
          await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
          await SecureStore.deleteItemAsync(STORAGE_KEYS.USER);
          await SecureStore.deleteItemAsync(STORAGE_KEYS.PASSWORD_UPGRADE);
        }
      } else {
        setApiTokens({ accessToken: null, refreshToken: null });
      }
    } catch {
      setApiTokens({ accessToken: null, refreshToken: null });
    } finally {
      // Mark hydration complete in all cases so the routing guards can run.
      set(next);
    }
  },
}));
