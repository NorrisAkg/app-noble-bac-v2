import React, { useEffect, useState } from 'react';
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
import { getProfile, updateProfile } from '@/services/profileService';
import { getApiErrorMessage } from '@/utils/apiError';
import type { Country, Series } from '@/types/api';

export default function SetupScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);

  const { data: countries = [], isLoading: loadingCountries } = useQuery({
    queryKey: ['countries'],
    queryFn: getCountries,
    staleTime: Infinity,
  });

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    staleTime: 60_000,
  });

  // Pré-sélectionne le pays + série du compte fraîchement créé.
  useEffect(() => {
    if (!profile || !countries.length || selectedCountry) return;
    const current = countries.find((c) => c.code === profile.country.code);
    if (current) {
      setSelectedCountry(current);
      const currentSeries = current.series.find((s) => s.id === String(profile.series.id));
      if (currentSeries) setSelectedSeries(currentSeries);
    }
  }, [profile, countries, selectedCountry]);

  const registeredCountryCode = profile?.country.code;
  const isDifferentCountry =
    selectedCountry !== null &&
    registeredCountryCode !== undefined &&
    selectedCountry.code !== registeredCountryCode;

  const updateMutation = useMutation({
    mutationFn: (seriesId: number) => updateProfile({ series_id: seriesId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      router.replace('/(tabs)');
    },
    onError: (error) => {
      Alert.alert('Erreur', getApiErrorMessage(error));
    },
  });

  const handleContinue = () => {
    if (!selectedSeries || !profile) return;

    if (isDifferentCountry) {
      Alert.alert(
        'Changement de pays',
        `Tu es inscrit en ${profile.country.name}. Pour changer de pays, contacte le support depuis ton profil. On garde tes préférences actuelles.`,
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Continuer', onPress: () => router.replace('/(tabs)') },
        ],
      );
      return;
    }

    const numericSeriesId = parseInt(selectedSeries.id, 10);
    if (Number.isNaN(numericSeriesId) || numericSeriesId === profile.series.id) {
      router.replace('/(tabs)');
      return;
    }

    updateMutation.mutate(numericSeriesId);
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
        {!showSeries && <CountryStep countries={countries} onSelect={setSelectedCountry} />}

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
        <View className="px-6 pt-3 pb-6 bg-background">
          <Button onPress={handleContinue} loading={updateMutation.isPending}>
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
            <Text className="font-poppins-semibold text-[13.5px] text-brand-ink mt-2.5">
              {c.name}
            </Text>
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
              Bac {s.label}
            </Text>
            {active && <Check size={20} color="#fff" strokeWidth={2.6} />}
          </TouchableOpacity>
        );
      })}
    </View>
  </>
);
