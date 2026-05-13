import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { User } from '@/types/api';
import { logout as apiLogout } from '@/services/authService';

const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'auth_user',
} as const;

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  /** Call after a successful login or OTP verification */
  setAuth: (user: User, token: string) => Promise<void>;
  /** Revokes the token on the server then clears local storage */
  logout: () => Promise<void>;
  /** Rehydrates auth state from SecureStore on app boot */
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setAuth: async (user, token) => {
    await SecureStore.setItemAsync(STORAGE_KEYS.TOKEN, token);
    await SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  logout: async () => {
    // Best-effort server revocation (don't block if it fails — e.g. offline)
    try {
      await apiLogout();
    } catch {
      // silent
    }
    await SecureStore.deleteItemAsync(STORAGE_KEYS.TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.USER);
    set({ user: null, token: null, isAuthenticated: false });
  },

  initialize: async () => {
    const token = await SecureStore.getItemAsync(STORAGE_KEYS.TOKEN);
    const rawUser = await SecureStore.getItemAsync(STORAGE_KEYS.USER);

    if (token && rawUser) {
      try {
        const user: User = JSON.parse(rawUser);
        set({ user, token, isAuthenticated: true });
      } catch {
        // Corrupted storage — clear it
        await SecureStore.deleteItemAsync(STORAGE_KEYS.TOKEN);
        await SecureStore.deleteItemAsync(STORAGE_KEYS.USER);
      }
    }
  },
}));
