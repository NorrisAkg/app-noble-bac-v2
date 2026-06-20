import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { User } from '@/types/api';
import { logout as apiLogout } from '@/services/authService';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'auth_user',
} as const;

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  /** True once initialize() has finished reading SecureStore on app boot */
  isHydrated: boolean;
  /** Call after a successful login or OTP verification */
  setAuth: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
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

  setAuth: async (user, accessToken, refreshToken) => {
    await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    await SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(user));
    set({ user, accessToken, refreshToken, isAuthenticated: true });
  },

  logout: async () => {
    // Best-effort server revocation
    try {
      await apiLogout();
    } catch {
      // silent
    }
    await get().clearLocal();
  },

  clearLocal: async () => {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.USER);
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  },

  initialize: async () => {
    try {
      const accessToken = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      const rawUser = await SecureStore.getItemAsync(STORAGE_KEYS.USER);

      if (accessToken && rawUser) {
        try {
          const user: User = JSON.parse(rawUser);
          set({ user, accessToken, refreshToken, isAuthenticated: true });
        } catch {
          // Corrupted storage — clear it
          await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
          await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
          await SecureStore.deleteItemAsync(STORAGE_KEYS.USER);
        }
      }
    } finally {
      // Mark hydration complete in all cases so the routing guards can run.
      set({ isHydrated: true });
    }
  },
}));
