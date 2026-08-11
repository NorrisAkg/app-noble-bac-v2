import { useState } from 'react';
import { buildE164Phone } from '@/utils/phone';
import { COUNTRIES, DEFAULT_DIAL_COUNTRY, type Country } from '@/constants/countries';

export type IdentifierMode = 'email' | 'phone';

export interface IdentifierInputState {
  mode: IdentifierMode;
  setMode: (mode: IdentifierMode) => void;
  email: string;
  setEmail: (value: string) => void;
  phone: string;
  setPhone: (value: string) => void;
  country: Country;
  setCountry: (country: Country) => void;
  /**
   * Valeur à poster au backend : l'email tel quel, ou le numéro assemblé en
   * E.164 avec l'indicatif sélectionné. Chaîne vide tant que le champ actif
   * est vide — `buildE164Phone` renverrait sinon l'indicatif seul (« +227 »),
   * qui passerait pour une saisie valide.
   */
  identifier: string;
  /** Le champ actif contient quelque chose. */
  isFilled: boolean;
  /**
   * Ouverture du sélecteur de pays. L'état vit ici et non dans le champ : la
   * sheet doit être montée à la racine de l'écran (hors du ScrollView), donc
   * loin du bouton qui la déclenche.
   */
  countryPickerOpen: boolean;
  openCountryPicker: () => void;
  closeCountryPicker: () => void;
}

/**
 * État partagé du champ « email ou téléphone » des écrans d'auth.
 *
 * Les deux saisies sont conservées séparément : basculer d'un onglet à l'autre
 * ne doit pas effacer ce qui a déjà été tapé, et surtout l'indicatif pays ne
 * peut pas être déduit d'un champ unique — `DEFAULT_DIAL_COUNTRY` vaut le Niger, si
 * bien qu'un numéro sénégalais préfixé en silence produirait le même 401 que
 * celui qu'on cherche à supprimer, en pire : invisible.
 */
export function useIdentifierInput(initialMode: IdentifierMode = 'email'): IdentifierInputState {
  const [mode, setMode] = useState<IdentifierMode>(initialMode);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState<Country>(DEFAULT_DIAL_COUNTRY);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);

  const trimmedEmail = email.trim();
  const trimmedPhone = phone.trim();

  const isFilled = (mode === 'email' ? trimmedEmail : trimmedPhone).length > 0;

  const identifier = !isFilled
    ? ''
    : mode === 'email'
      ? trimmedEmail
      : buildE164Phone(country.dial, trimmedPhone);

  return {
    mode,
    setMode,
    email,
    setEmail,
    phone,
    setPhone,
    country,
    setCountry,
    identifier,
    isFilled,
    countryPickerOpen,
    openCountryPicker: () => setCountryPickerOpen(true),
    closeCountryPicker: () => setCountryPickerOpen(false),
  };
}

/** Options du sélecteur de pays, dérivées du référentiel statique. */
export const IDENTIFIER_COUNTRY_OPTIONS = COUNTRIES.map((c) => ({
  key: c.code,
  code: c.code,
  name: c.name,
  dial: c.dial,
}));
