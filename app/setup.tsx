import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react-native';
import { AppBar } from '@/components/ui/AppBar';
import { Button } from '@/components/ui/Button';
import { CountryMap } from '@/components/ui/CountryMap';
import { Heading } from '@/components/ui/Heading';
import { C } from '@/constants/theme';
import { getCountries } from '@/services/referentialService';
import { getProfile, switchActiveCountry } from '@/services/profileService';
import { getApiErrorMessage } from '@/utils/apiError';
import { withCountryPreposition } from '@/utils/countryLocative';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Country, Series } from '@/types/api';
import { queryKeys } from '@/lib/queryKeys';

export default function SetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);

  const { data: countries = [], isLoading: loadingCountries } = useQuery({
    queryKey: queryKeys.referential.countries(),
    queryFn: getCountries,
  });

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    staleTime: 60_000,
  });

  const handleCountrySelect = (c: Country) => {
    setSelectedCountry(c);
    if (profile && c.code === profile.active_country.code) {
      const activeSeries = c.series.find((s) => s.id === String(profile.active_series.id));
      setSelectedSeries(activeSeries ?? null);
    } else {
      setSelectedSeries(null);
    }
  };

  const activeCountryCode = profile?.active_country.code;
  const isDifferentActiveCountry =
    selectedCountry !== null &&
    activeCountryCode !== undefined &&
    selectedCountry.code !== activeCountryCode;

  const switchMutation = useMutation({
    mutationFn: (payload: { active_country_id: number; active_series_id: number }) =>
      switchActiveCountry(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      router.replace('/(tabs)');
    },
    onError: (error) => {
      Alert.alert('Erreur', getApiErrorMessage(error));
    },
  });

  const confirmAndSwitch = (country: Country, series: Series) => {
    const numericCountryId = parseInt(country.id, 10);
    const numericSeriesId = parseInt(series.id, 10);
    switchMutation.mutate({ active_country_id: numericCountryId, active_series_id: numericSeriesId });
  };

  const handleContinue = () => {
    if (!selectedSeries || !selectedCountry) return;

    // Filet de sécurité : si le profil n'a pas pu être chargé (token absent
    // ou expiré), on ne peut pas savoir si le user change de pays/série.
    // Plutôt qu'un return silencieux qui laisse l'utilisateur perplexe, on
    // signale clairement et on renvoie vers /login.
    if (!profile) {
      Alert.alert(
        'Session expirée',
        'Tu n\'es pas authentifié. Reconnecte-toi pour finaliser ton inscription.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }],
      );
      return;
    }

    const numericSeriesId = parseInt(selectedSeries.id, 10);

    // Pays actif ET série actives inchangés : rien à faire.
    if (!isDifferentActiveCountry && numericSeriesId === profile.active_series.id) {
      router.replace('/(tabs)');
      return;
    }

    // Pays actif inchangé, seule la série change : pas besoin de confirmation,
    // aucun contenu "pays" n'est affecté.
    if (!isDifferentActiveCountry) {
      confirmAndSwitch(selectedCountry, selectedSeries);
      return;
    }

    // Changement de pays actif : le contenu affiché va changer et l'abonnement
    // ne suit pas automatiquement — on prévient avant de confirmer.
    Alert.alert(
      'Changer de pays actif ?',
      `Tu vas passer ${withCountryPreposition(selectedCountry.code, selectedCountry.name)}. Tu ne verras plus que le contenu de ce pays — ton pays d'origine (${profile.country.name}) reste enregistré et tu pourras y revenir à tout moment. Ton abonnement est propre à chaque pays et série : s'il n'est pas déjà actif ${withCountryPreposition(selectedCountry.code, selectedCountry.name)} pour cette série, il faudra se réabonner pour débloquer le contenu Premium.`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Changer', onPress: () => confirmAndSwitch(selectedCountry, selectedSeries) },
      ],
    );
  };

  const isLoading = loadingCountries || loadingProfile;
  const showSeries = selectedCountry !== null;

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={C.green} size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <AppBar
        title={showSeries ? 'Ta série' : 'Ton pays'}
        onBack={showSeries ? () => setSelectedCountry(null) : undefined}
      />

      <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 24 }}>
        {!showSeries && <CountryStep countries={countries} onSelect={handleCountrySelect} />}

        {showSeries && selectedCountry && (
          <SeriesStep
            country={selectedCountry}
            onModify={() => setSelectedCountry(null)}
            selected={selectedSeries}
            onSelect={setSelectedSeries}
          />
        )}
      </ScrollView>

      {showSeries && selectedSeries && (
        <View className="px-6 pt-3 bg-background" style={{ paddingBottom: Math.max(insets.bottom, 24) }}>
          <Button onPress={handleContinue} loading={switchMutation.isPending}>
            Continuer
          </Button>
        </View>
      )}
    </View>
  );
}

interface CountryStepProps {
  countries: Country[];
  onSelect: (c: Country) => void;
}

const CountryStep: React.FC<CountryStepProps> = ({ countries, onSelect }) => (
  <>
    <Heading level="h2">Dans quel pays passes-tu le BAC ?</Heading>
    <Text className="font-poppins text-[13.5px] text-brand-ink-medium mt-1.5 mb-6 leading-5">
      On adapte les épreuves, les corrigés et les quiz à ton pays.
    </Text>

    <View className="flex-row flex-wrap -mx-1.5">
      {countries.map((c) => (
        <View key={c.id} className="w-1/2 px-1.5 mb-3">
          <TouchableOpacity
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

interface SeriesStepProps {
  country: Country;
  onModify: () => void;
  selected: Series | null;
  onSelect: (s: Series) => void;
}

const SeriesStep: React.FC<SeriesStepProps> = ({ country, onModify, selected, onSelect }) => (
  <>
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: C.line,
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 16,
        marginBottom: 22,
      }}
    >
      <CountryMap code={country.code} size={32} />
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: 'Poppins_500Medium',
            fontSize: 11,
            color: C.ink3,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
          }}
        >
          Pays
        </Text>
        <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: C.ink }}>
          {country.name}
        </Text>
      </View>
      <TouchableOpacity onPress={onModify}>
        <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: C.green }}>
          Modifier
        </Text>
      </TouchableOpacity>
    </View>

    <Heading level="h2">Choisis ta série</Heading>
    <Text className="font-poppins text-[13.5px] text-brand-ink-medium mt-1.5 mb-4">
      Tu pourras la changer plus tard depuis ton profil.
    </Text>

    <View style={{ gap: 10 }}>
      {country.series.map((s) => {
        const active = selected?.id === s.id;
        return (
          <TouchableOpacity
            key={s.id}
            activeOpacity={0.85}
            onPress={() => onSelect(s)}
            style={{
              height: 60,
              backgroundColor: active ? C.salmon : '#fff',
              borderWidth: 1.5,
              borderColor: active ? C.salmon : C.line,
              borderRadius: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              paddingHorizontal: 18,
            }}
          >
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: active ? '#fff' : C.salmonSoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  fontFamily: 'Poppins_700Bold',
                  fontSize: 13,
                  color: C.salmonDark,
                }}
              >
                {s.code.slice(0, 2)}
              </Text>
            </View>
            <Text
              style={{
                flex: 1,
                fontFamily: 'Poppins_700Bold',
                fontSize: 15,
                color: active ? '#fff' : C.ink,
              }}
            >
              {s.code}
            </Text>
            {active && <Check size={20} color="#fff" strokeWidth={2.6} />}
          </TouchableOpacity>
        );
      })}
    </View>
  </>
);
