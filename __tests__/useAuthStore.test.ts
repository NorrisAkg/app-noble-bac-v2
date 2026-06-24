import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../store/useAuthStore';
import { logout as apiLogout } from '../services/authService';
import type { User } from '../types/api';

jest.mock('../services/authService', () => ({
  logout: jest.fn(),
}));

const mockedSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;
const mockedApiLogout = apiLogout as jest.MockedFunction<typeof apiLogout>;

const userFixture: User = {
  id: 'u-1',
  first_name: 'Awa',
  last_name: 'Diallo',
  phone: '+221701234567',
  country_id: 'c-1',
  series_id: 's-1',
  phone_verified_at: '2026-04-01T10:00:00Z',
  is_active: true,
};

describe('useAuthStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isHydrated: false,
    });
  });

  it('setAuth persiste en SecureStore et met le state a jour', async () => {
    await useAuthStore.getState().setAuth(userFixture, 'access-tok', 'refresh-tok');

    expect(mockedSecureStore.setItemAsync).toHaveBeenCalledWith('access_token', 'access-tok');
    expect(mockedSecureStore.setItemAsync).toHaveBeenCalledWith('refresh_token', 'refresh-tok');
    expect(mockedSecureStore.setItemAsync).toHaveBeenCalledWith(
      'auth_user',
      JSON.stringify(userFixture)
    );

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(userFixture);
    expect(state.accessToken).toBe('access-tok');
    expect(state.refreshToken).toBe('refresh-tok');
  });

  it('clearLocal supprime les 3 cles SecureStore et reset le state', async () => {
    useAuthStore.setState({
      user: userFixture,
      accessToken: 'a',
      refreshToken: 'r',
      isAuthenticated: true,
    });

    await useAuthStore.getState().clearLocal();

    expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith('access_token');
    expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith('refresh_token');
    expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_user');

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
  });

  it('logout appelle le serveur puis clearLocal', async () => {
    useAuthStore.setState({
      user: userFixture,
      accessToken: 'a',
      refreshToken: 'r',
      isAuthenticated: true,
    });
    mockedApiLogout.mockResolvedValueOnce(undefined);

    await useAuthStore.getState().logout();

    expect(mockedApiLogout).toHaveBeenCalledTimes(1);
    expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledTimes(3);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('logout fait le clearLocal meme si la revocation serveur echoue (best-effort)', async () => {
    useAuthStore.setState({
      user: userFixture,
      accessToken: 'a',
      refreshToken: 'r',
      isAuthenticated: true,
    });
    mockedApiLogout.mockRejectedValueOnce(new Error('Network down'));

    await useAuthStore.getState().logout();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledTimes(3);
  });

  it('initialize rehydrate le state quand tokens et user sont presents', async () => {
    mockedSecureStore.getItemAsync.mockImplementation((key) => {
      const map: Record<string, string | null> = {
        access_token: 'stored-access',
        refresh_token: 'stored-refresh',
        auth_user: JSON.stringify(userFixture),
      };
      return Promise.resolve(map[key] ?? null);
    });

    await useAuthStore.getState().initialize();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.id).toBe('u-1');
    expect(state.accessToken).toBe('stored-access');
    expect(state.refreshToken).toBe('stored-refresh');
    expect(state.isHydrated).toBe(true);
  });

  it('initialize ne fait rien si pas d\'access token stocke', async () => {
    mockedSecureStore.getItemAsync.mockResolvedValue(null);

    await useAuthStore.getState().initialize();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isHydrated).toBe(true);
  });

  it('initialize nettoie SecureStore si le JSON user est corrompu', async () => {
    mockedSecureStore.getItemAsync.mockImplementation((key) => {
      const map: Record<string, string | null> = {
        access_token: 'stored-access',
        refresh_token: 'stored-refresh',
        auth_user: '{not valid json',
      };
      return Promise.resolve(map[key] ?? null);
    });

    await useAuthStore.getState().initialize();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().isHydrated).toBe(true);
    expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith('access_token');
    expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith('refresh_token');
    expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_user');
  });
});
