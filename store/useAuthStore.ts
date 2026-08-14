import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { User } from '@/types/api';
import { logout as apiLogout } from '@/services/authService';
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
  /** True once initialize() has finished reading SecureStore on app boot */
  isHydrated: boolean;
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
  passwordUpgradeRequired: false,

  setAuth: async (user, accessToken, refreshToken, passwordUpgradeRequired = false) => {
    await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    await SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(user));
    await SecureStore.setItemAsync(
      STORAGE_KEYS.PASSWORD_UPGRADE,
      passwordUpgradeRequired ? '1' : '0',
    );
    set({ user, accessToken, refreshToken, isAuthenticated: true, passwordUpgradeRequired });
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
    // Toutes les fins de session passent par ici : déconnexion volontaire,
    // session invalidée par le serveur (apiClient), suppression de compte. Le
    // compte Google doit être oublié dans les trois cas, sans quoi le prochain
    // « Continuer avec Google » reconnecte le même compte en silence, sans même
    // afficher le sélecteur. Best-effort en interne : le state local ne dépend
    // pas de l'aboutissement de cet aller-retour.
    await forgetGoogleAccount();

    await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.USER);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.PASSWORD_UPGRADE);
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      passwordUpgradeRequired: false,
    });
  },

  initialize: async () => {
    // Build the final state in memory and commit it in a single set() so the
    // routing layer never observes an intermediate {isAuthenticated:true,
    // isHydrated:false} frame (which would race index.tsx vs the layout guard).
    let next: Partial<AuthState> = { isHydrated: true };
    try {
      const accessToken = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      const rawUser = await SecureStore.getItemAsync(STORAGE_KEYS.USER);

      if (accessToken && rawUser) {
        try {
          const user: User = JSON.parse(rawUser);
          const upgrade = await SecureStore.getItemAsync(STORAGE_KEYS.PASSWORD_UPGRADE);
          next = {
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isHydrated: true,
            passwordUpgradeRequired: upgrade === '1',
          };
        } catch {
          // Corrupted storage — clear it
          await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
          await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
          await SecureStore.deleteItemAsync(STORAGE_KEYS.USER);
          await SecureStore.deleteItemAsync(STORAGE_KEYS.PASSWORD_UPGRADE);
        }
      }
    } finally {
      // Mark hydration complete in all cases so the routing guards can run.
      set(next);
    }
  },
}));
