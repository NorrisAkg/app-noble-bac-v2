import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Check, ChevronDown } from 'lucide-react-native';
import { AppBar } from '@/components/ui/AppBar';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { GoogleButton } from '@/components/ui/GoogleButton';
import { CountryPickerSheet } from '@/components/ui/CountryPickerSheet';
import { CountryMap } from '@/components/ui/CountryMap';
import { getCountries } from '@/services/referentialService';
import { register } from '@/services/authService';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { getApiErrorMessage, getValidationErrors } from '@/utils/apiError';
import { buildE164Phone } from '@/utils/phone';
import { COUNTRIES, DEFAULT_COUNTRY, type Country } from '@/constants/countries';
import { queryKeys } from '@/lib/queryKeys';

const MIN_PASSWORD_LENGTH = 8;

export default function SignupScreen() {
  const router = useRouter();

  // ── Form state ────────────────────────────────────────────────────────────
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [agree, setAgree] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // ── Selection state ───────────────────────────────────────────────────────
  // Le `country.id` backend est résolu au submit via le référentiel API. La
  // filière n'est PAS demandée ici — le backend auto-affecte la 1re série
  // active du pays, l'utilisateur la choisit/corrige sur `/setup`.
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);

  const {
    data: apiCountries = [],
    isLoading: loadingApiCountries,
    isError: referentialError,
    error: referentialErrorObj,
  } = useQuery({
    queryKey: queryKeys.referential.countries(),
    queryFn: getCountries,
  });

  const apiCountry = apiCountries.find((c) => c.code === country.code) ?? null;

  // Le téléphone est désormais facultatif : un compte peut vivre sans, et le
  // numéro sera demandé au moment du paiement s'il manque.
  const trimmedPhone = phone.trim();
  const e164Phone = trimmedPhone ? buildE164Phone(country.dial, trimmedPhone) : undefined;

  const passwordsMatch = password.length > 0 && password === passwordConfirm;

  const isValid =
    !!firstName.trim() &&
    !!lastName.trim() &&
    !!email.trim() &&
    password.length >= MIN_PASSWORD_LENGTH &&
    passwordsMatch &&
    agree;

  const clearError = (field: string) =>
    setFieldErrors((errors) => {
      if (!errors[field]) return errors;
      const { [field]: _removed, ...rest } = errors;
      return rest;
    });

  const google = useGoogleAuth({ countryId: apiCountry?.id ?? null });

  // ── Register mutation ─────────────────────────────────────────────────────
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
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
        email: email.trim(),
        password,
        password_confirmation: passwordConfirm,
        ...(e164Phone ? { phone: e164Phone } : {}),
        country_id: apiCountry.id,
      });
    },
    onSuccess: () => {
      router.push({ pathname: '/(auth)/verify-email', params: { email: email.trim() } });
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

          {/* ── Nom ── */}
          <View className="flex-row gap-3">
            <Input
              containerClassName="flex-1"
              placeholder="Prénom"
              autoCapitalize="words"
              value={firstName}
              onChangeText={(v) => { setFirstName(v); clearError('first_name'); }}
              error={fieldErrors.first_name}
            />
            <Input
              containerClassName="flex-1"
              placeholder="Nom"
              autoCapitalize="words"
              value={lastName}
              onChangeText={(v) => { setLastName(v); clearError('last_name'); }}
              error={fieldErrors.last_name}
            />
          </View>

          {/* ── Email ── */}
          <Input
            label="Adresse email"
            placeholder="toi@exemple.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            value={email}
            onChangeText={(v) => { setEmail(v); clearError('email'); }}
            error={fieldErrors.email}
            helperText="On t'y enverra ton code de vérification."
          />

          {/* ── Téléphone (facultatif) ── */}
          <Input
            label="Numéro de téléphone (facultatif)"
            placeholder="90 12 34 56"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={(v) => { setPhone(v); clearError('phone'); }}
            error={fieldErrors.phone}
            helperText="Nécessaire seulement pour payer par mobile money."
            icon={
              <TouchableOpacity
                key={country.code}
                onPress={() => setCountryPickerOpen(true)}
                className="flex-row items-center gap-1.5 pr-2 border-r border-line"
              >
                <CountryMap code={country.code} size={22} />
                <Text className="font-poppins-semibold text-sm text-brand-ink ml-1">{country.dial}</Text>
                <ChevronDown size={14} color="#5A6470" />
              </TouchableOpacity>
            }
          />

          {/* ── Mot de passe ── */}
          <PasswordInput
            label="Mot de passe"
            placeholder="8 caractères minimum"
            value={password}
            onChangeText={(v) => { setPassword(v); clearError('password'); }}
            error={fieldErrors.password}
          />

          <PasswordInput
            label="Confirme le mot de passe"
            placeholder="Retape ton mot de passe"
            value={passwordConfirm}
            onChangeText={setPasswordConfirm}
            // Erreur affichée seulement une fois la confirmation entamée, pour
            // ne pas signaler une divergence avant que l'utilisateur ait tapé.
            error={
              passwordConfirm.length > 0 && !passwordsMatch
                ? 'Les deux mots de passe ne correspondent pas.'
                : undefined
            }
          />

          {/* ── CGU ── */}
          <TouchableOpacity
            onPress={() => setAgree((v) => !v)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: agree }}
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

          {/* Statut du référentiel — préventif : si l'API ne répond pas,
              l'utilisateur sait pourquoi le submit échouera. */}
          {loadingApiCountries ? (
            <Text className="font-poppins text-xs text-brand-ink-medium text-center mt-3">
              Chargement du référentiel…
            </Text>
          ) : referentialError ? (
            <Text className="font-poppins-medium text-xs text-brand-danger text-center mt-3">
              {getApiErrorMessage(referentialErrorObj)}
            </Text>
          ) : null}

          {/* ── Séparateur ── */}
          <View className="flex-row items-center my-5">
            <View className="flex-1 h-[1px] bg-line" />
            <Text className="font-poppins text-xs text-brand-ink-medium mx-3">ou</Text>
            <View className="flex-1 h-[1px] bg-line" />
          </View>

          <GoogleButton
            onPress={google.start}
            loading={google.isPending}
            // Sans pays résolu, le backend refuserait la création : mieux vaut
            // un bouton inerte qu'une erreur après la fenêtre Google.
            disabled={isPending || !apiCountry}
          />

          <View className="mt-6 mb-10 flex-row justify-center gap-1">
            <Text className="font-poppins text-[13.5px] text-brand-ink-medium">Déjà inscrit ?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text className="font-poppins-semibold text-[13.5px] text-brand-green">Se connecter</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
