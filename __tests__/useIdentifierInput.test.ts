import { renderHook, act } from '@testing-library/react-native';

import {
  useIdentifierInput,
  IDENTIFIER_COUNTRY_OPTIONS,
} from '@/hooks/useIdentifierInput';
import { COUNTRIES, DEFAULT_DIAL_COUNTRY } from '@/constants/countries';

// RNTL 14 : `renderHook` et `act` sont asynchrones — sans `await`, `result`
// reste indéfini (cf. le même avertissement dans Input.test.tsx).

describe('useIdentifierInput', () => {
  it('démarre sur l\'onglet demandé, vide', async () => {
    const { result } = await renderHook(() => useIdentifierInput('email'));

    expect(result.current.mode).toBe('email');
    expect(result.current.country).toEqual(DEFAULT_DIAL_COUNTRY);
    expect(result.current.identifier).toBe('');
    expect(result.current.isFilled).toBe(false);
  });

  it('renvoie l\'email débarrassé de ses espaces', async () => {
    const { result } = await renderHook(() => useIdentifierInput('email'));

    await act(() => result.current.setEmail('  awa@noble-bac.com  '));

    expect(result.current.identifier).toBe('awa@noble-bac.com');
    expect(result.current.isFilled).toBe(true);
  });

  it('assemble le numéro local en E.164 avec l\'indicatif sélectionné', async () => {
    const { result } = await renderHook(() => useIdentifierInput('phone'));
    const senegal = COUNTRIES.find((c) => c.code === 'SN')!;

    await act(() => result.current.setCountry(senegal));
    await act(() => result.current.setPhone('77 123 45 67'));

    expect(result.current.identifier).toBe('+221771234567');
  });

  it('n\'invente pas un identifiant quand le numéro est vide', async () => {
    // Sans ce garde, `buildE164Phone` renvoie l'indicatif seul (« +227 ») :
    // le bouton s'activerait et la requête partirait avec un faux numéro.
    const { result } = await renderHook(() => useIdentifierInput('phone'));

    await act(() => result.current.setPhone('   '));

    expect(result.current.identifier).toBe('');
    expect(result.current.isFilled).toBe(false);
  });

  it('bascule d\'onglet sans perdre la saisie de l\'autre', async () => {
    const { result } = await renderHook(() => useIdentifierInput('email'));

    await act(() => result.current.setEmail('awa@noble-bac.com'));
    await act(() => result.current.setPhone('90123456'));
    await act(() => result.current.setMode('phone'));

    expect(result.current.identifier).toBe('+22790123456');

    await act(() => result.current.setMode('email'));

    expect(result.current.identifier).toBe('awa@noble-bac.com');
  });

  it('pilote l\'ouverture du sélecteur de pays', async () => {
    // L'état vit dans le hook parce que la sheet est montée à la racine de
    // l'écran, loin du bouton qui la déclenche.
    const { result } = await renderHook(() => useIdentifierInput('phone'));

    expect(result.current.countryPickerOpen).toBe(false);

    await act(() => result.current.openCountryPicker());
    expect(result.current.countryPickerOpen).toBe(true);

    await act(() => result.current.closeCountryPicker());
    expect(result.current.countryPickerOpen).toBe(false);
  });

  it('expose tous les pays du référentiel au picker', () => {
    expect(IDENTIFIER_COUNTRY_OPTIONS).toHaveLength(COUNTRIES.length);
    expect(IDENTIFIER_COUNTRY_OPTIONS[0]).toMatchObject({
      key: COUNTRIES[0].code,
      code: COUNTRIES[0].code,
      dial: COUNTRIES[0].dial,
    });
  });
});
