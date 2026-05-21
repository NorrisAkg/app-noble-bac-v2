import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { AppBar } from '@/components/ui/AppBar';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { CountryPickerSheet } from '@/components/ui/CountryPickerSheet';
import { Check, ChevronDown } from 'lucide-react-native';
import { CountryFlag } from '@/components/ui/CountryFlag';
import { getCountries } from '@/services/referentialService';
import { register } from '@/services/authService';
import { getApiErrorMessage, getValidationErrors } from '@/utils/apiError';
import { buildE164Phone } from '@/utils/phone';
import { COUNTRIES, DEFAULT_COUNTRY, type Country } from '@/constants/countries';

export default function SignupScreen() {
  const router = useRouter();

  // ── Form state ────────────────────────────────────────────────────────────
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // ── Selection state ───────────────────────────────────────────────────────
  // Même UX que sur /login : on s'appuie sur la liste statique des pays UEMOA
  // (`constants/countries`) avec Niger pré-sélectionné. Le `country.id` backend
  // est résolu au moment du submit via le référentiel API (cache
  // `staleTime: Infinity`). La filière n'est PAS demandée ici — le backend
  // auto-affecte la 1re série active du pays, l'utilisateur la choisit/corrige
  // sur `/setup` après vérification OTP (CDC US-AUTH-04).
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);

  // Référentiel API préchargé (résolution du country_id backend au submit).
  const { data: apiCountries = [], isLoading: loadingApiCountries } = useQuery({
    queryKey: ['countries'],
    queryFn: getCountries,
    staleTime: Infinity,
  });

  const e164Phone = buildE164Phone(country.dial, phone);

  // isValid ne dépend QUE des champs utilisateur. Le référentiel API est
  // une exigence technique vérifiée au submit (l'utilisateur n'a pas
  // conscience qu'il « doit » avoir une série).
  const isValid =
    !!firstName.trim() &&
    !!lastName.trim() &&
    phone.length >= 6 &&
    password.length >= 8 &&
    agree;

  // ── Register mutation ─────────────────────────────────────────────────────
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const apiCountry = apiCountries.find((c) => c.code === country.code) ?? null;
      if (!apiCountry) {
        throw new Error(
          loadingApiCountries
            ? 'Le référentiel des pays charge encore, réessaie dans un instant.'
            : `Pays ${country.code} introuvable côté API. Vérifie le serveur.`,
        );
      }
      return register({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: e164Phone,
        password,
        country_id: apiCountry.id,
        // series_id volontairement omis : le backend auto-affecte
        // (le user choisira / corrigera via /setup).
      });
    },
    onSuccess: () => {
      router.push({ pathname: '/(auth)/verify', params: { phone: e164Phone } });
    },
    onError: (error) => {
      const validationErrors = getValidationErrors(error);
      if (Object.keys(validationErrors).length > 0) {
        setFieldErrors(validationErrors);
      } else {
        Alert.alert('Inscription échouée', getApiErrorMessage(error));
      }
    },
  });

  return (
    <View className="flex-1 bg-background">
      <AppBar title="Créer un compte" onBack={() => router.back()} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-6 pt-6" keyboardShouldPersistTaps="handled">
          <Text className="font-poppins-bold text-[22px] text-brand-ink tracking-tighter">
            Bienvenue dans Noble BAC
          </Text>
          <Text className="font-poppins text-[13.5px] text-brand-ink-medium mt-1 mb-5 leading-5">
            Quelques infos pour personnaliser ton parcours.
          </Text>

          {/* ── Name ── */}
          <View className="flex-row gap-3">
            <Input
              containerClassName="flex-1"
              placeholder="Prénom"
              value={firstName}
              onChangeText={(v) => { setFirstName(v); setFieldErrors((e) => ({ ...e, first_name: '' })); }}
            />
            <Input
              containerClassName="flex-1"
              placeholder="Nom"
              value={lastName}
              onChangeText={(v) => { setLastName(v); setFieldErrors((e) => ({ ...e, last_name: '' })); }}
            />
          </View>

          {/* ── Phone ── */}
          <Input
            label="Numéro de téléphone"
            placeholder="90 12 34 56"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={(v) => { setPhone(v); setFieldErrors((e) => ({ ...e, phone: '' })); }}
            icon={
              <TouchableOpacity
                onPress={() => setCountryPickerOpen(true)}
                className="flex-row items-center gap-1.5 pr-2 border-r border-line"
              >
                <CountryFlag code={country.code} size={22} />
                <Text className="font-poppins-semibold text-sm text-brand-ink ml-1">{country.dial}</Text>
                <ChevronDown size={14} color="#5A6470" />
              </TouchableOpacity>
            }
          />
          {fieldErrors.phone ? (
            <Text className="text-red-500 font-poppins text-xs -mt-3 mb-3">{fieldErrors.phone}</Text>
          ) : null}

          {/* ── Password ── */}
          <Input
            placeholder="Mot de passe (8 caractères min)"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {/* ── Terms ── */}
          <TouchableOpacity
            onPress={() => setAgree((v) => !v)}
            className="flex-row items-start gap-2.5 mt-2 mb-6"
          >
            <View className={`w-[22px] h-[22px] rounded-md border-[1.5px] items-center justify-center ${
              agree ? 'bg-brand-green border-brand-green' : 'bg-white border-line'
            }`}>
              {agree && <Check size={14} color="white" strokeWidth={3} />}
            </View>
            <Text className="flex-1 font-poppins text-[12.5px] text-brand-ink-medium leading-5">
              J&apos;accepte les{' '}
              <Text className="text-brand-green font-poppins-semibold">conditions d&apos;utilisation</Text>
              {' '}et la{' '}
              <Text className="text-brand-green font-poppins-semibold">politique de confidentialité</Text>.
            </Text>
          </TouchableOpacity>

          <Button onPress={() => mutate()} disabled={!isValid} loading={isPending}>
            Créer mon compte
          </Button>

          {/* Feedback statut référentiel — préventif. Si l'API ne répond
              plus ou que la liste est vide, l'utilisateur sait pourquoi
              le submit échouera au lieu d'un bouton silencieusement bloqué. */}
          {loadingApiCountries ? (
            <Text className="font-poppins text-xs text-brand-ink-medium text-center mt-3">
              Chargement du référentiel…
            </Text>
          ) : apiCountries.length === 0 ? (
            <Text className="font-poppins-medium text-xs text-red-500 text-center mt-3">
              Référentiel indisponible. Vérifie le serveur API.
            </Text>
          ) : null}

          <View className="mt-6 mb-10 flex-row justify-center gap-1">
            <Text className="font-poppins text-[13.5px] text-brand-ink-medium">Déjà inscrit ?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text className="font-poppins-semibold text-[13.5px] text-brand-green">Se connecter</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Country picker (identique à /login) ── */}
      <CountryPickerSheet
        isOpen={countryPickerOpen}
        onClose={() => setCountryPickerOpen(false)}
        options={COUNTRIES.map((c) => ({ key: c.code, code: c.code, name: c.name, dial: c.dial }))}
        selectedKey={country.code}
        onSelect={(opt) => {
          const next = COUNTRIES.find((c) => c.code === opt.key);
          if (next) setCountry(next);
        }}
      />
    </View>
  );
}
