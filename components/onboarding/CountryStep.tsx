import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { CountryMap } from '@/components/ui/CountryMap';
import { Heading } from '@/components/ui/Heading';
import type { Country } from '@/types/api';

interface CountryStepProps {
  countries: Country[];
  onSelect: (country: Country) => void;
}

/**
 * Grille de sélection du pays (cartes géographiques, pas de drapeaux ni de
 * compteur de séries — cf. CDC v1.4 §3).
 *
 * Partagée par deux parcours : l'écran `(auth)/country`, qui précède
 * l'inscription et fixe `users.country_id`, et `/setup`, où l'utilisateur
 * change son pays ACTIF depuis son profil. Même geste, mêmes cartes.
 */
export const CountryStep: React.FC<CountryStepProps> = ({ countries, onSelect }) => (
  <>
    <Heading level="h2">Dans quel pays passes-tu le BAC ?</Heading>
    <Text className="font-poppins text-[13.5px] text-brand-ink-medium mt-1.5 mb-6 leading-5">
      On adapte les épreuves, les corrigés et les quiz à ton pays.
    </Text>

    <View className="flex-row flex-wrap -mx-1.5">
      {countries.map((c) => (
        <View key={c.id} className="w-1/2 px-1.5 mb-3">
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={c.name}
            activeOpacity={0.85}
            onPress={() => onSelect(c)}
            style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              paddingVertical: 18,
              paddingHorizontal: 10,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#1A2027',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 10,
              elevation: 2,
            }}
          >
            <CountryMap code={c.code} size={84} />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  </>
);
