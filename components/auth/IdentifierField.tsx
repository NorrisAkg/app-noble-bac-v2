import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { Input } from '@/components/ui/Input';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { CountryPickerSheet } from '@/components/ui/CountryPickerSheet';
import { CountryMap } from '@/components/ui/CountryMap';
import { COUNTRIES } from '@/constants/countries';
import {
  IDENTIFIER_COUNTRY_OPTIONS,
  type IdentifierInputState,
  type IdentifierMode,
} from '@/hooks/useIdentifierInput';

const MODES: readonly { value: IdentifierMode; label: string }[] = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Téléphone' },
];

interface IdentifierFieldProps {
  state: IdentifierInputState;
  /** Message d'erreur affiché sous le champ actif. */
  error?: string;
  /** Appelé à chaque édition (saisie ou changement d'onglet) — sert à purger l'erreur. */
  onEdit?: () => void;
  emailHelperText?: string;
  phoneHelperText?: string;
}

/**
 * Champ d'identification des écrans d'auth : bascule email / téléphone, avec
 * sélecteur d'indicatif pays côté téléphone.
 *
 * L'indicatif est le point du dispositif. Le backend compare le numéro à la
 * valeur E.164 stockée, donc une saisie locale (`0790123456`) ne matche aucun
 * compte et ressort en 401 « Identifiants invalides » — indiscernable d'un
 * mauvais mot de passe. Le rendre visible et modifiable est ce qui règle le
 * problème ; l'onglet n'est que ce qui lui fait de la place.
 *
 * La sheet de sélection n'est pas rendue ici : elle vit dans
 * `IdentifierCountrySheet`, à monter à la racine de l'écran.
 */
export const IdentifierField: React.FC<IdentifierFieldProps> = ({
  state,
  error,
  onEdit,
  emailHelperText,
  phoneHelperText,
}) => {
  const edit = (apply: () => void) => {
    apply();
    onEdit?.();
  };

  return (
    <>
      <SegmentedControl
        options={MODES}
        value={state.mode}
        onChange={(mode) => edit(() => state.setMode(mode))}
        containerClassName="mb-4"
      />

      {state.mode === 'email' ? (
        <Input
          label="Adresse email"
          placeholder="toi@exemple.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          value={state.email}
          onChangeText={(v) => edit(() => state.setEmail(v))}
          error={error}
          helperText={emailHelperText}
        />
      ) : (
        <Input
          label="Numéro de téléphone"
          placeholder="90 12 34 56"
          keyboardType="phone-pad"
          autoComplete="tel"
          value={state.phone}
          onChangeText={(v) => edit(() => state.setPhone(v))}
          error={error}
          helperText={phoneHelperText}
          icon={
            <TouchableOpacity
              onPress={state.openCountryPicker}
              accessibilityRole="button"
              accessibilityLabel={`Indicatif ${state.country.dial}, changer de pays`}
              className="flex-row items-center gap-1.5 pr-2 border-r border-line"
            >
              <CountryMap code={state.country.code} size={22} />
              <Text className="font-poppins-semibold text-sm text-brand-ink ml-1">
                {state.country.dial}
              </Text>
              <ChevronDown size={14} color="#5A6470" />
            </TouchableOpacity>
          }
        />
      )}
    </>
  );
};

/**
 * Sheet de sélection du pays associée à `IdentifierField`.
 *
 * À monter à la racine de l'écran, en frère du conteneur scrollable — jamais
 * dans son contenu. `@gorhom/bottom-sheet` est un conteneur positionné en
 * absolu qui couvre l'écran : imbriqué dans un `ScrollView`, il est mesuré dans
 * le flux et se rend au milieu du formulaire, sans backdrop.
 */
export const IdentifierCountrySheet: React.FC<{
  state: IdentifierInputState;
  /** Même rôle que sur le champ : changer d'indicatif change l'identifiant. */
  onEdit?: () => void;
}> = ({ state, onEdit }) => (
  <CountryPickerSheet
    isOpen={state.countryPickerOpen}
    onClose={state.closeCountryPicker}
    options={IDENTIFIER_COUNTRY_OPTIONS}
    selectedKey={state.country.code}
    onSelect={(option) => {
      const country = COUNTRIES.find((c) => c.code === option.code);
      if (!country) return;
      state.setCountry(country);
      onEdit?.();
    }}
  />
);
