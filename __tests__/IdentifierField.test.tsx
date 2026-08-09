import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

import { Text } from 'react-native';

import { IdentifierField, IdentifierCountrySheet } from '@/components/auth/IdentifierField';
import { useIdentifierInput, type IdentifierMode } from '@/hooks/useIdentifierInput';

// Le picker vit dans une bottom sheet Gorhom, qui exige un environnement de
// gestes complet : hors sujet ici, on ne teste que le champ lui-même.
jest.mock('@/components/ui/CountryPickerSheet', () => ({
  CountryPickerSheet: () => null,
}));

/**
 * Câble le champ sur son hook, comme le font les écrans d'auth : la sheet est
 * un frère du champ, pas un enfant — elle doit être montée à la racine de
 * l'écran, hors du ScrollView.
 */
const Harness: React.FC<{ initialMode?: IdentifierMode; onEdit?: () => void }> = ({
  initialMode = 'email',
  onEdit,
}) => {
  const state = useIdentifierInput(initialMode);
  return (
    <>
      <IdentifierField state={state} onEdit={onEdit} />
      <IdentifierCountrySheet state={state} onEdit={onEdit} />
      <Text testID="picker-state">{state.countryPickerOpen ? 'ouvert' : 'fermé'}</Text>
    </>
  );
};

describe('IdentifierField', () => {
  it('affiche le champ email par défaut, sans indicatif', async () => {
    await render(<Harness />);

    expect(screen.getByText('Adresse email')).toBeTruthy();
    expect(screen.queryByText('+227')).toBeNull();
  });

  it('bascule sur le champ téléphone et révèle l\'indicatif', async () => {
    await render(<Harness />);

    await fireEvent.press(screen.getByText('Téléphone'));

    expect(screen.getByText('Numéro de téléphone')).toBeTruthy();
    // C'est tout l'objet du correctif : l'indicatif est visible et cliquable,
    // l'utilisateur n'a plus à le taper à la main pour être reconnu.
    expect(screen.getByText('+227')).toBeTruthy();
    expect(screen.getByLabelText(/Indicatif \+227/)).toBeTruthy();
  });

  it('ouvre le sélecteur de pays depuis l\'indicatif', async () => {
    await render(<Harness initialMode="phone" />);

    expect(screen.getByTestId('picker-state').props.children).toBe('fermé');

    await fireEvent.press(screen.getByLabelText(/Indicatif \+227/));

    expect(screen.getByTestId('picker-state').props.children).toBe('ouvert');
  });

  it('notifie chaque édition, saisie comme changement d\'onglet', async () => {
    const onEdit = jest.fn();
    await render(<Harness onEdit={onEdit} />);

    await fireEvent.changeText(screen.getByPlaceholderText('toi@exemple.com'), 'a@b.com');
    expect(onEdit).toHaveBeenCalledTimes(1);

    await fireEvent.press(screen.getByText('Téléphone'));
    expect(onEdit).toHaveBeenCalledTimes(2);
  });

  it('conserve la saisie email en revenant de l\'onglet téléphone', async () => {
    await render(<Harness />);

    await fireEvent.changeText(screen.getByPlaceholderText('toi@exemple.com'), 'awa@noble-bac.com');
    await fireEvent.press(screen.getByText('Téléphone'));
    await fireEvent.press(screen.getByText('Email'));

    expect(screen.getByDisplayValue('awa@noble-bac.com')).toBeTruthy();
  });
});
