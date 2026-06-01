import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

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

// ─── Request interceptor ──────────────────────────────────────────────────────
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
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
let refreshInFlight: Promise<string | null> | null = null;

/**
 * Calls POST /auth/refresh with the stored refresh_token.
 * Uses a bare axios call (not apiClient) so the request itself is not
 * intercepted, which would trigger an infinite loop on its own 401.
 *
 * Returns the new access_token on success, or null on any failure.
 * On success, updates SecureStore with the rotated tokens.
 */
export async function performRefresh(): Promise<string | null> {
  const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  if (!refreshToken) return null;

  try {
    const baseURL = apiClient.defaults.baseURL ?? '';
    const response = await axios.post(
      `${baseURL}/auth/refresh`,
      { refresh_token: refreshToken },
      { headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'ngrok-skip-browser-warning': 'true' } },
    );
    const tokens = response.data?.data;
    if (!tokens?.access_token || !tokens?.refresh_token) {
      return null;
    }
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.access_token);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refresh_token);
    return tokens.access_token as string;
  } catch {
    return null;
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

    if (!refreshInFlight) {
      refreshInFlight = performRefresh().finally(() => {
        refreshInFlight = null;
      });
    }

    const newToken = await refreshInFlight;

    if (!newToken) {
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
    }

    originalRequest.headers.set('Authorization', `Bearer ${newToken}`);
    return apiClient(originalRequest);
  },
);

export default apiClient;
