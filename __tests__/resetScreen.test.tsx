import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import ResetPasswordScreen from '@/app/(auth)/reset';

jest.mock('@/services/authService', () => ({
  requestPasswordReset: jest.fn().mockResolvedValue({ success: true }),
  resetPassword: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => ({ identifier: 'eleve@noble-bac.com' }),
}));

// L'AppBar de l'écran lit les insets ; en prod le provider vient de
// react-navigation.
const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const renderScreen = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <QueryClientProvider client={client}>
        <ResetPasswordScreen />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
};

describe('ResetPasswordScreen', () => {
  it('propose un renvoi du code, verrouillé par un compte à rebours', async () => {
    await renderScreen();

    expect(screen.getByText(/Renvoyer \(\d+s\)/)).toBeTruthy();
    expect(screen.queryByText('Renvoyer le code')).toBeNull();
  });

  it('invite à regarder dans les spams', async () => {
    // Cause n°1 de « code jamais reçu » côté utilisateur, une fois la chaîne
    // d'envoi serveur réparée.
    await renderScreen();

    expect(screen.getByText(/Pense à regarder dans tes spams/)).toBeTruthy();
  });
});
