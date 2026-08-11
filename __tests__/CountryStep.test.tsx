import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

import { CountryStep } from '@/components/onboarding/CountryStep';
import type { Country } from '@/types/api';

const COUNTRIES: Country[] = [
  {
    id: '1',
    name: 'Bénin',
    code: 'BJ',
    phone_code: '+229',
    flag_emoji: '🇧🇯',
    payment_enabled: true,
    is_active: true,
    series: [],
  },
  {
    id: '6',
    name: 'Niger',
    code: 'NE',
    phone_code: '+227',
    flag_emoji: '🇳🇪',
    payment_enabled: true,
    is_active: true,
    series: [],
  },
];

describe('CountryStep', () => {
  it('affiche une carte par pays du référentiel', async () => {
    await render(<CountryStep countries={COUNTRIES} onSelect={jest.fn()} />);

    expect(screen.getByLabelText('Bénin')).toBeTruthy();
    expect(screen.getByLabelText('Niger')).toBeTruthy();
  });

  it('remonte le pays choisi, et pas un pays par défaut', async () => {
    const onSelect = jest.fn();
    await render(<CountryStep countries={COUNTRIES} onSelect={onSelect} />);

    await fireEvent.press(screen.getByLabelText('Bénin'));

    expect(onSelect).toHaveBeenCalledWith(COUNTRIES[0]);
  });

  it('n\'affiche aucune carte quand le référentiel est vide', async () => {
    await render(<CountryStep countries={[]} onSelect={jest.fn()} />);

    expect(screen.queryByLabelText('Niger')).toBeNull();
  });
});
