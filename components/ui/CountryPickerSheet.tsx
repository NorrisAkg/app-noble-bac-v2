import React from 'react';
import { TouchableOpacity, View, Text, ScrollView } from 'react-native';
import { Check } from 'lucide-react-native';
import { C } from '@/constants/theme';
import { CustomBottomSheet } from './BottomSheet';
import { CountryMap } from './CountryMap';

/**
 * Description normalisée d'un pays affichable dans le picker.
 * Aligne les deux sources (`constants/countries` pour le login, API
 * `getCountries` pour le signup) sur une même forme afin de garantir une UI
 * cohérente entre les écrans.
 */
export interface CountryPickerOption {
  /** Identifiant stable (peut être un id base ou un code ISO). */
  key: string;
  /** ISO-3166 alpha-2 — utilisé pour afficher carte et drapeau (BJ, SN, …). */
  code: string;
  /** Libellé affiché (ex: "Bénin"). */
  name: string;
  /** Indicatif téléphonique au format E.164 (ex: "+229"). */
  dial: string;
}

interface CountryPickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  options: CountryPickerOption[];
  selectedKey?: string | null;
  onSelect: (option: CountryPickerOption) => void;
  title?: string;
}

export const CountryPickerSheet: React.FC<CountryPickerSheetProps> = ({
  isOpen,
  onClose,
  options,
  selectedKey,
  onSelect,
  title = 'Choisis ton pays',
}) => (
  <CustomBottomSheet isOpen={isOpen} onClose={onClose} title={title} snapPoints={['70%']}>
    <ScrollView contentContainerStyle={{ paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
      {options.map((c) => {
        const active = selectedKey === c.key;
        return (
          <TouchableOpacity
            key={c.key}
            activeOpacity={0.7}
            onPress={() => {
              onSelect(c);
              onClose();
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              paddingVertical: 14,
              paddingHorizontal: 16,
              borderRadius: 12,
              backgroundColor: active ? C.greenSoft : 'transparent',
            }}
          >
            <CountryMap code={c.code} size={26} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14.5, color: C.ink }}>
                {c.name}
              </Text>
              <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 12.5, color: C.ink3 }}>
                {c.dial}
              </Text>
            </View>
            {active && <Check size={20} color={C.green} strokeWidth={2.4} />}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  </CustomBottomSheet>
);
