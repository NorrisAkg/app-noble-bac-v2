import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

import { PasswordInput } from '@/components/ui/PasswordInput';

// RNTL 14 : `render` et `fireEvent` sont asynchrones — voir Input.test.tsx.

describe('PasswordInput', () => {
  it('masque le mot de passe par défaut', async () => {
    await render(<PasswordInput placeholder="mdp" testID="champ" />);

    expect(screen.getByTestId('champ').props.secureTextEntry).toBe(true);
  });

  it('révèle puis remasque le mot de passe', async () => {
    await render(<PasswordInput placeholder="mdp" testID="champ" />);

    await fireEvent.press(screen.getByLabelText('Afficher le mot de passe'));
    expect(screen.getByTestId('champ').props.secureTextEntry).toBe(false);

    await fireEvent.press(screen.getByLabelText('Masquer le mot de passe'));
    expect(screen.getByTestId('champ').props.secureTextEntry).toBe(true);
  });

  it('remonte la saisie', async () => {
    const onChangeText = jest.fn();
    await render(<PasswordInput placeholder="mdp" onChangeText={onChangeText} />);

    await fireEvent.changeText(screen.getByPlaceholderText('mdp'), 'motdepasse8');

    expect(onChangeText).toHaveBeenCalledWith('motdepasse8');
  });

  it('affiche le message d\'erreur', async () => {
    await render(
      <PasswordInput
        placeholder="mdp"
        error="Le mot de passe doit contenir au moins 8 caractères."
      />,
    );

    expect(screen.getByText('Le mot de passe doit contenir au moins 8 caractères.')).toBeTruthy();
  });

  it('désactive autocapitalisation et correction', async () => {
    // Sans ça, Android met une majuscule au premier caractère et corrige le
    // champ une fois révélé : le mot de passe saisi diffère silencieusement
    // de celui affiché.
    await render(<PasswordInput placeholder="mdp" testID="champ" />);

    const champ = screen.getByTestId('champ');
    expect(champ.props.autoCapitalize).toBe('none');
    expect(champ.props.autoCorrect).toBe(false);
  });
});
