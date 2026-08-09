import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { KeyboardAwareScreen } from '@/components/ui/KeyboardAwareScreen';

// Le composant lit les insets ; en prod le provider vient de react-navigation.
const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const renderInSafeArea = (ui: React.ReactElement) =>
  render(<SafeAreaProvider initialMetrics={METRICS}>{ui}</SafeAreaProvider>);

describe('KeyboardAwareScreen', () => {
  it('rend son contenu', async () => {
    await renderInSafeArea(
      <KeyboardAwareScreen>
        <Text>Se connecter</Text>
      </KeyboardAwareScreen>,
    );

    expect(screen.getByText('Se connecter')).toBeTruthy();
  });

  it('garde les taps actifs clavier ouvert', async () => {
    // Sans ça, le premier tap sur le bouton de soumission ne ferait que fermer
    // le clavier : c'est précisément le geste que le correctif doit servir.
    await renderInSafeArea(
      <KeyboardAwareScreen testID="screen">
        <Text>Se connecter</Text>
      </KeyboardAwareScreen>,
    );

    expect(screen.getByTestId('screen').props.keyboardShouldPersistTaps).toBe('handled');
  });

  it('laisse l\'écran surcharger les props du ScrollView', async () => {
    await renderInSafeArea(
      <KeyboardAwareScreen testID="screen" keyboardShouldPersistTaps="always">
        <Text>Se connecter</Text>
      </KeyboardAwareScreen>,
    );

    expect(screen.getByTestId('screen').props.keyboardShouldPersistTaps).toBe('always');
  });
});
