import React from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { AppBar } from '@/components/ui/AppBar';
import { CountryStep } from '@/components/onboarding/CountryStep';
import { C } from '@/constants/theme';
import { queryKeys } from '@/lib/queryKeys';
import { getCountries } from '@/services/referentialService';
import type { Country } from '@/types/api';

/**
 * Première étape du parcours d'inscription : le pays.
 *
 * Il précède le formulaire parce que `users.country_id` est le scope
 * d'origine du compte, figé à la création — il détermine les séries, le
 * catalogue et les abonnements. Auparavant l'écran d'inscription retombait sur
 * une constante `DEFAULT_COUNTRY`, si bien que tous les comptes naissaient
 * dans le même pays sans que personne ne l'ait choisi.
 *
 * Le `country_id` retenu est passé en paramètre de route à `/(auth)/signup`,
 * qui le poste tel quel : plus de résolution du référentiel au submit.
 */
export default function CountryScreen() {
  const router = useRouter();

  const { data: countries = [], isLoading } = useQuery({
    queryKey: queryKeys.referential.countries(),
    queryFn: getCountries,
  });

  const handleSelect = (country: Country) => {
    router.push({
      pathname: '/(auth)/signup',
      params: { countryId: country.id, countryCode: country.code },
    });
  };

  return (
    <View className="flex-1 bg-background">
      <AppBar title="Ton pays" onBack={() => router.back()} />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={C.green} size="large" />
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-6 pt-6"
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          <CountryStep countries={countries} onSelect={handleSelect} />
        </ScrollView>
      )}
    </View>
  );
}
