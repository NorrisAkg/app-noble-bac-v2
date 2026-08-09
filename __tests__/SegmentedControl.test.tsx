import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

import { SegmentedControl } from '@/components/ui/SegmentedControl';

const OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Téléphone' },
] as const;

describe('SegmentedControl', () => {
  it('rend tous les segments', async () => {
    await render(<SegmentedControl options={OPTIONS} value="email" onChange={jest.fn()} />);

    expect(screen.getByText('Email')).toBeTruthy();
    expect(screen.getByText('Téléphone')).toBeTruthy();
  });

  it('marque le segment actif comme sélectionné', async () => {
    await render(<SegmentedControl options={OPTIONS} value="phone" onChange={jest.fn()} />);

    expect(screen.getByLabelText('Téléphone').props.accessibilityState.selected).toBe(true);
    expect(screen.getByLabelText('Email').props.accessibilityState.selected).toBe(false);
  });

  it('remonte la valeur du segment pressé', async () => {
    const onChange = jest.fn();
    await render(<SegmentedControl options={OPTIONS} value="email" onChange={onChange} />);

    await fireEvent.press(screen.getByText('Téléphone'));

    expect(onChange).toHaveBeenCalledWith('phone');
  });
});
