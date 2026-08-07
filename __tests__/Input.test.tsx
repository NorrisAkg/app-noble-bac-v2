import React from 'react';
import { Text } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';

import { Input } from '@/components/ui/Input';

// RNTL 14 : `render` et `fireEvent` sont asynchrones. Sans `await`, render
// renvoie une promesse et `screen` reste vide, avec un message trompeur
// (« render function has not been called »).

describe('Input', () => {
  it('affiche le label et le placeholder', async () => {
    await render(<Input label="Adresse email" placeholder="toi@exemple.com" />);

    expect(screen.getByText('Adresse email')).toBeTruthy();
    expect(screen.getByPlaceholderText('toi@exemple.com')).toBeTruthy();
  });

  it('remonte la saisie', async () => {
    const onChangeText = jest.fn();
    await render(<Input placeholder="email" onChangeText={onChangeText} />);

    await fireEvent.changeText(screen.getByPlaceholderText('email'), 'awa@noble-bac.com');

    expect(onChangeText).toHaveBeenCalledWith('awa@noble-bac.com');
  });

  it('affiche le message d\'erreur', async () => {
    await render(<Input placeholder="email" error="Un compte existe déjà avec cet email." />);

    expect(screen.getByText('Un compte existe déjà avec cet email.')).toBeTruthy();
  });

  it('affiche le texte d\'aide en l\'absence d\'erreur', async () => {
    await render(<Input placeholder="mdp" helperText="8 caractères minimum" />);

    expect(screen.getByText('8 caractères minimum')).toBeTruthy();
  });

  it('masque le texte d\'aide dès qu\'une erreur s\'affiche', async () => {
    // Les deux ne doivent jamais coexister : l'aide dirait quoi faire pendant
    // que l'erreur dit ce qui ne va pas, sur deux lignes empilées.
    await render(<Input placeholder="mdp" helperText="8 caractères minimum" error="Trop court." />);

    expect(screen.getByText('Trop court.')).toBeTruthy();
    expect(screen.queryByText('8 caractères minimum')).toBeNull();
  });

  it('n\'affiche aucune ligne sous le champ sans erreur ni aide', async () => {
    await render(<Input label="Email" placeholder="email" />);

    // Seul le label doit être rendu comme texte.
    expect(screen.getAllByText(/.+/)).toHaveLength(1);
  });

  it('rend les éléments gauche et droit', async () => {
    await render(
      <Input placeholder="tel" icon={<Text>+227</Text>} rightIcon={<Text>oeil</Text>} />,
    );

    expect(screen.getByText('+227')).toBeTruthy();
    expect(screen.getByText('oeil')).toBeTruthy();
  });

  it('transmet les props TextInput natives', async () => {
    await render(<Input placeholder="email" keyboardType="email-address" testID="champ" />);

    expect(screen.getByTestId('champ').props.keyboardType).toBe('email-address');
  });
});
