import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { AppBar } from '@/components/ui/AppBar';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { CustomBottomSheet } from '@/components/ui/BottomSheet';
import { Check, ChevronDown } from 'lucide-react-native';
import { CountryFlag } from '@/components/ui/CountryFlag';
import { CountryMap } from '@/components/ui/CountryMap';
import { getCountries } from '@/services/referentialService';
import { register } from '@/services/authService';
import { getApiErrorMessage, getValidationErrors } from '@/utils/apiError';
import type { Country, Series } from '@/types/api';

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
  const [country, setCountry] = useState<Country | null>(null);
  const [series, setSeries] = useState<Series | null>(null);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [seriesPickerOpen, setSeriesPickerOpen] = useState(false);

  // ── Load countries from the API (public, cached) ──────────────────────────
  const { data: countries = [], isLoading: loadingCountries } = useQuery({
    queryKey: ['countries'],
    queryFn: getCountries,
    staleTime: Infinity, // Referential data almost never changes
  });

  const e164Phone = `${country?.phone_code ?? ''}${phone.replace(/^0+/, '')}`;
  const isValid =
    firstName.trim() &&
    lastName.trim() &&
    phone.length >= 6 &&
    password.length >= 8 &&
    country !== null &&
    series !== null &&
    agree;

  // ── Register mutation ─────────────────────────────────────────────────────
  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      register({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: e164Phone,
        password,
        country_id: country!.id,
        series_id: series!.id,
      }),
    onSuccess: () => {
      // Navigate to OTP verification, passing the phone number
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

  const handleCountrySelect = (c: Country) => {
    setCountry(c);
    setSeries(null); // Reset series when country changes
    setCountryPickerOpen(false);
  };

  const availableSeries = country?.series ?? [];

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
                {loadingCountries ? (
                  <ActivityIndicator size="small" color="#3DBE45" />
                ) : (
                  <>
                    {country && <CountryFlag code={country.iso_code} size={22} />}
                    <Text className="font-poppins-semibold text-sm text-brand-ink ml-1">
                      {country ? country.phone_code : '──'}
                    </Text>
                    <ChevronDown size={14} color="#5A6470" />
                  </>
                )}
              </TouchableOpacity>
            }
          />
          {fieldErrors.phone ? (
            <Text className="text-red-500 font-poppins text-xs -mt-3 mb-3">{fieldErrors.phone}</Text>
          ) : null}

          {/* ── Series ── */}
          <TouchableOpacity
            onPress={() => availableSeries.length > 0 && setSeriesPickerOpen(true)}
            className={`flex-row items-center justify-between h-[54px] px-4 bg-white border-[1.5px] rounded-[14px] mb-4 ${
              series ? 'border-brand-green' : 'border-line'
            } ${availableSeries.length === 0 ? 'opacity-50' : ''}`}
            disabled={availableSeries.length === 0}
          >
            <Text className={`font-poppins text-[15px] ${series ? 'text-brand-ink' : 'text-[#9AA3AC]'}`}>
              {series ? series.name : country ? 'Choisir une filière' : 'Sélectionne d\'abord un pays'}
            </Text>
            <ChevronDown size={16} color="#9AA3AC" />
          </TouchableOpacity>

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

          <View className="mt-6 mb-10 flex-row justify-center gap-1">
            <Text className="font-poppins text-[13.5px] text-brand-ink-medium">Déjà inscrit ?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text className="font-poppins-semibold text-[13.5px] text-brand-green">Se connecter</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Country picker ── */}
      <CustomBottomSheet
        isOpen={countryPickerOpen}
        onClose={() => setCountryPickerOpen(false)}
        title="Choisis ton pays"
        snapPoints={['60%']}
      >
        <ScrollView>
          {countries.map((c) => (
            <TouchableOpacity
              key={c.id}
              onPress={() => handleCountrySelect(c)}
              className={`flex-row items-center gap-3.5 p-4 rounded-xl ${
                c.id === country?.id ? 'bg-brand-green/10' : 'bg-transparent'
              }`}
            >
              <CountryMap code={c.iso_code} size={32} />
              <View className="flex-1">
                <Text className="font-poppins-semibold text-[14.5px] text-brand-ink">{c.name}</Text>
                <Text className="font-poppins text-xs text-brand-ink-light">{c.phone_code}</Text>
              </View>
              {c.id === country?.id && <Check size={20} color="#3DBE45" strokeWidth={2.4} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </CustomBottomSheet>

      {/* ── Series picker ── */}
      <CustomBottomSheet
        isOpen={seriesPickerOpen}
        onClose={() => setSeriesPickerOpen(false)}
        title="Choisis ta filière"
        snapPoints={['40%']}
      >
        <ScrollView>
          {availableSeries.map((s) => (
            <TouchableOpacity
              key={s.id}
              onPress={() => { setSeries(s); setSeriesPickerOpen(false); }}
              className={`flex-row items-center justify-between p-4 rounded-xl ${
                s.id === series?.id ? 'bg-brand-green/10' : 'bg-transparent'
              }`}
            >
              <Text className="font-poppins-semibold text-[14.5px] text-brand-ink">{s.name}</Text>
              {s.id === series?.id && <Check size={20} color="#3DBE45" strokeWidth={2.4} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </CustomBottomSheet>
    </View>
  );
}
