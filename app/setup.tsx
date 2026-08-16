import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react-native';
import { AppBar } from '@/components/ui/AppBar';
import { Button } from '@/components/ui/Button';
import { CountryMap } from '@/components/ui/CountryMap';
import { CountryStep } from '@/components/onboarding/CountryStep';
import { Heading } from '@/components/ui/Heading';
import { C } from '@/constants/theme';
import { getCountries } from '@/services/referentialService';
import { getProfile, switchActiveCountry } from '@/services/profileService';
import { getApiErrorMessage } from '@/utils/apiError';
import { withCountryPreposition } from '@/utils/countryLocative';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Country, Series } from '@/types/api';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/useAuthStore';

export default function SetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  // Deux paramètres, deux sens distincts — les confondre en un seul booléen
  // rendait l'onboarding impossible à distinguer d'un réglage depuis le profil.
  //
  // `step=series` : ouvrir directement l'étape série, le pays étant déjà connu.
  // `origin` : d'où l'on vient. En `onboarding` (retour des félicitations), le
  //   pays vient d'être choisi à l'inscription et `users.country_id` est de
  //   toute façon immuable : ni flèche retour ni bouton « Modifier ». En
  //   `profile`, l'utilisateur ajuste son pays ACTIF et doit pouvoir revenir.
  const { step, origin } = useLocalSearchParams<{ step?: string; origin?: string }>();
  const openOnSeries = step === 'series';
  const fromOnboarding = origin === 'onboarding';
  const fromProfile = openOnSeries && !fromOnboarding;

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

  const handleCountrySelect = useCallback(
    (c: Country) => {
      setSelectedCountry(c);
      if (profile && c.code === profile.active_country.code) {
        const activeSeries = c.series.find((s) => s.id === String(profile.active_series.id));
        setSelectedSeries(activeSeries ?? null);
      } else {
        setSelectedSeries(null);
      }
    },
    [profile],
  );

  const activeCountryCode = profile?.active_country?.code ?? profile?.country?.code;
  const activeCountry = countries.find(
    (c) =>
      (activeCountryCode && c.code.toUpperCase() === activeCountryCode.toUpperCase()) ||
      String(c.id) === String(profile?.active_country?.id ?? profile?.country?.id),
  );

  // Pré-sélection du pays actif quand on vient du profil ou de l'onboarding, une seule fois.
  // Le garde par `ref` est essentiel : sans lui, un clic sur « Modifier »
  // (qui remet selectedCountry à null) serait aussitôt annulé par cet effet,
  // rendant l'étape pays inatteignable.
  const prefilledRef = useRef(false);
  useEffect(() => {
    if (!openOnSeries || prefilledRef.current || !profile || countries.length === 0) return;
    if (activeCountry) {
      prefilledRef.current = true;
      handleCountrySelect(activeCountry);
    }
  }, [openOnSeries, profile, countries, activeCountry, handleCountrySelect]);

  const effectiveCountry = selectedCountry ?? (openOnSeries && !prefilledRef.current ? activeCountry ?? null : null);
  const isDifferentActiveCountry =
    effectiveCountry !== null &&
    activeCountryCode !== undefined &&
    effectiveCountry.code !== activeCountryCode;

  const switchMutation = useMutation({
    mutationFn: (payload: { active_country_id: number; active_series_id: number }) =>
      switchActiveCountry(payload),
    onSuccess: () => {
      useAuthStore.setState({ isNewUser: false });
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
    if (!selectedSeries || !effectiveCountry) return;

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
      useAuthStore.setState({ isNewUser: false });
      router.replace('/(tabs)');
      return;
    }

    // Pays actif inchangé, seule la série change : pas besoin de confirmation,
    // aucun contenu "pays" n'est affecté.
    if (!isDifferentActiveCountry) {
      confirmAndSwitch(effectiveCountry, selectedSeries);
      return;
    }

    // Changement de pays actif : le contenu affiché va changer et l'abonnement
    // ne suit pas automatiquement — on prévient avant de confirmer.
    Alert.alert(
      'Changer de pays actif ?',
      `Tu vas passer ${withCountryPreposition(effectiveCountry.code, effectiveCountry.name)}. Tu ne verras plus que le contenu de ce pays — ton pays d'origine (${profile.country.name}) reste enregistré et tu pourras y revenir à tout moment. Ton abonnement est propre à chaque pays et série : s'il n'est pas déjà actif ${withCountryPreposition(effectiveCountry.code, effectiveCountry.name)} pour cette série, il faudra se réabonner pour débloquer le contenu Premium.`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Changer', onPress: () => confirmAndSwitch(effectiveCountry, selectedSeries) },
      ],
    );
  };

  const isLoading = loadingCountries || loadingProfile;
  const showSeries = effectiveCountry !== null;

  // Depuis le profil la flèche est toujours présente : à l'étape série elle
  // ferme l'écran (on n'est jamais passé par l'étape pays), à l'étape pays elle
  // revient à la série — sinon l'utilisateur y serait bloqué sans issue.
  // Dans l'onboarding, comportement d'origine : pas de flèche à l'étape pays.
  const leaveScreen = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/profile');
  };

  const handleBack = () => {
    if (showSeries && !openOnSeries) {
      setSelectedCountry(null);
      return;
    }
    // Étape pays en mode profil : on retourne à la série du pays actif. Si ce
    // pays n'est plus disponible, il n'y a rien à afficher : on ferme l'écran.
    if (!showSeries && activeCountry) {
      handleCountrySelect(activeCountry);
      return;
    }
    leaveScreen();
  };

  // En onboarding l'écran est terminal : le pays vient d'être choisi et il n'y
  // a rien derrière — la flèche renverrait vers les écrans d'auth déjà passés.
  const showBack = !fromOnboarding && (showSeries || fromProfile);

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
        onBack={showBack ? handleBack : undefined}
      />

      <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 24 }}>
        {!showSeries && <CountryStep countries={countries} onSelect={handleCountrySelect} />}

        {showSeries && effectiveCountry && (
          <SeriesStep
            country={effectiveCountry}
            // Pas de changement de pays juste après l'inscription : il vient
            // d'être choisi, et le modifier ici ne toucherait que le pays ACTIF
            // sans corriger le pays d'origine du compte.
            onModify={
              fromOnboarding
                ? undefined
                : () => {
                    prefilledRef.current = true;
                    setSelectedCountry(null);
                  }
            }
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

interface SeriesStepProps {
  country: Country;
  /** Absent en onboarding : le pays vient d'être choisi à l'inscription. */
  onModify?: () => void;
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
      {onModify && (
        <TouchableOpacity onPress={onModify}>
          <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: C.green }}>
            Modifier
          </Text>
        </TouchableOpacity>
      )}
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
