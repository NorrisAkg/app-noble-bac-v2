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

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../services/googleService');
jest.mock('../services/authService');
jest.mock('../services/accountService');

import { renderHook, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { useGoogleAuth } from '../hooks/useGoogleAuth';
import * as googleService from '../services/googleService';
import * as authService from '../services/authService';
import * as accountService from '../services/accountService';
import { useAuthStore } from '../store/useAuthStore';

describe('useGoogleAuth - Simulation Pratique de Parcours', () => {
  const mockRouter = {
    replace: jest.fn(),
    push: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isHydrated: true,
    });
  });

  it('Scénario 1 : Inscription fluide d\'un nouvel élève Google avec redirection vers congrats', async () => {
    (googleService.signInWithGoogle as jest.Mock).mockResolvedValue('google-token-123');
    (authService.googleSignIn as jest.Mock).mockResolvedValue({
      data: {
        user: { id: '1', first_name: 'Awa', last_name: 'Diop', email: 'awa@gmail.com' },
        access_token: 'acc-token',
        refresh_token: 'ref-token',
        is_new_user: true,
      },
    });

    const { result } = await renderHook(() => useGoogleAuth({ countryId: '1' }));

    await act(async () => {
      await result.current.start();
    });

    // 1. Google sign in appelé
    expect(googleService.signInWithGoogle).toHaveBeenCalledTimes(1);

    // 2. Appel API avec country_id et id_token
    expect(authService.googleSignIn).toHaveBeenCalledWith({
      id_token: 'google-token-123',
      country_id: '1',
    });

    // 3. Redirection vers l'écran de félicitations / onboarding
    expect(mockRouter.replace).toHaveBeenCalledWith('/(auth)/congrats');

    // 4. Store hydraté
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.first_name).toBe('Awa');
  });

  it('Scénario 2 : Connexion d\'un utilisateur Google existant sans passer par congrats', async () => {
    (googleService.signInWithGoogle as jest.Mock).mockResolvedValue('google-token-456');
    (authService.googleSignIn as jest.Mock).mockResolvedValue({
      data: {
        user: { id: '2', first_name: 'Moussa', last_name: 'Sow', email: 'moussa@gmail.com' },
        access_token: 'acc-token-existing',
        refresh_token: 'ref-token-existing',
        is_new_user: false,
      },
    });

    const { result } = await renderHook(() => useGoogleAuth());

    await act(async () => {
      await result.current.start();
    });

    // Doit rediriger directement vers (tabs) si c'est un utilisateur existant
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');

    // Store hydraté
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.first_name).toBe('Moussa');
  });

  it('Scénario 3 : Nouvel utilisateur tapant Google depuis Login (sans pays)', async () => {
    (googleService.signInWithGoogle as jest.Mock).mockResolvedValue('google-token-789');

    const error422 = {
      isAxiosError: true,
      response: {
        status: 422,
        data: {
          errors: {
            country_id: ['Le pays est requis pour créer un compte.'],
          },
        },
      },
    };
    (authService.googleSignIn as jest.Mock).mockRejectedValue(error422);

    const onCountryRequired = jest.fn();
    const { result } = await renderHook(() => useGoogleAuth({ onCountryRequired }));

    await act(async () => {
      await result.current.start();
    });

    expect(onCountryRequired).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('Scénario 4 : Alerte explicite en cas d\'erreur de configuration native (code 10 DEVELOPER_ERROR)', async () => {
    const devError = { code: '10', message: 'DEVELOPER_ERROR' };
    (googleService.signInWithGoogle as jest.Mock).mockRejectedValue(devError);
    (googleService.formatGoogleErrorMessage as jest.Mock).mockReturnValue(
      'Configuration Google incomplète (code 10). Vérifie l\'enregistrement de l\'empreinte SHA-1 de l\'application et du Web Client ID dans Google Cloud / Firebase.',
    );

    const { result } = await renderHook(() => useGoogleAuth());

    await act(async () => {
      await result.current.start();
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Connexion Google échouée',
      expect.stringContaining('Configuration Google incomplète (code 10)'),
    );
  });

  it('Scénario 5 : Annulation de suppression pour un compte Google en période de grâce', async () => {
    (googleService.signInWithGoogle as jest.Mock).mockResolvedValue('google-token-grace');
    (googleService.formatGoogleErrorMessage as jest.Mock).mockReturnValue(
      'Erreur inconnue lors de la connexion Google.',
    );

    const error403 = {
      isAxiosError: true,
      response: {
        status: 403,
        data: {
          message: 'Ce compte est en cours de suppression. Tu peux encore annuler.',
          errors: {
            purge_at: ['2026-09-15T12:00:00Z'],
          },
        },
      },
    };
    (authService.googleSignIn as jest.Mock).mockRejectedValue(error403);
    (accountService.cancelAccountDeletion as jest.Mock).mockResolvedValue({
      user: { id: '3', first_name: 'Fatou', email: 'fatou@gmail.com' },
      access_token: 'restored-token',
      refresh_token: 'restored-refresh',
    });

    const { result } = await renderHook(() => useGoogleAuth());

    await act(async () => {
      await result.current.start();
    });

    // Alert déclenchée avec proposition d'annulation
    expect(Alert.alert).toHaveBeenCalledWith(
      'Compte en cours de suppression',
      expect.stringContaining('Ton compte sera définitivement supprimé'),
      expect.arrayContaining([
        expect.objectContaining({ text: 'Annuler la suppression' }),
      ]),
    );

    // Simulation du clic sur « Annuler la suppression »
    const alertButtons = (Alert.alert as jest.Mock).mock.calls[0][2];
    const cancelAction = alertButtons.find((b: any) => b.text === 'Annuler la suppression');

    await act(async () => {
      await cancelAction.onPress();
    });

    expect(accountService.cancelAccountDeletion).toHaveBeenCalledWith({
      google_id_token: 'google-token-grace',
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.first_name).toBe('Fatou');
  });
});
