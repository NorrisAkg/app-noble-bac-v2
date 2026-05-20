import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { AppBar } from '@/components/ui/AppBar';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { CountryFlag } from '@/components/ui/CountryFlag';
import { CountryPickerSheet } from '@/components/ui/CountryPickerSheet';
import { ChevronDown } from 'lucide-react-native';
import { requestPasswordReset } from '@/services/authService';
import { getApiErrorMessage } from '@/utils/apiError';
import { COUNTRIES, DEFAULT_COUNTRY, type Country } from '@/constants/countries';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [phone, setPhone] = useState('');

  const e164Phone = `${country.dial}${phone.replace(/^0+/, '')}`;
  const isValid = phone.length >= 6;

  const { mutate, isPending } = useMutation({
    mutationFn: () => requestPasswordReset({ phone: e164Phone }),
    onSuccess: () => {
      // Backend always returns 200 to avoid enumeration; we navigate
      // unconditionally to the OTP step.
      router.push({ pathname: '/(auth)/reset', params: { phone: e164Phone } });
    },
    onError: (error) => {
      Alert.alert('Erreur', getApiErrorMessage(error));
    },
  });

  return (
    <View className="flex-1 bg-background">
      <AppBar title="Mot de passe oublié" onBack={() => router.back()} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-6 pt-7" keyboardShouldPersistTaps="handled">
          <Text className="font-poppins-bold text-2xl text-brand-ink tracking-tighter">
            Réinitialiser
          </Text>
          <Text className="font-poppins text-sm text-brand-ink-medium mt-1.5 mb-6 leading-5">
            Saisis le numéro de téléphone associé à ton compte. Tu recevras un code par SMS pour confirmer ton identité.
          </Text>

          <Input
            label="Numéro de téléphone"
            placeholder="90 12 34 56"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            icon={
              <TouchableOpacity
                onPress={() => setPickerOpen(true)}
                className="flex-row items-center gap-1.5 pr-2 border-r border-line"
              >
                <CountryFlag code={country.code} size={22} />
                <Text className="font-poppins-semibold text-sm text-brand-ink ml-1">{country.dial}</Text>
                <ChevronDown size={14} color="#5A6470" />
              </TouchableOpacity>
            }
          />

          <View className="mt-2 mb-6">
            <Button onPress={() => mutate()} disabled={!isValid} loading={isPending}>
              Envoyer le code
            </Button>
          </View>

          <View className="flex-row justify-center gap-1">
            <Text className="font-poppins text-[13.5px] text-brand-ink-medium">
              Tu te souviens du mot de passe ?
            </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
              <Text className="font-poppins-semibold text-[13.5px] text-brand-green">
                Se connecter
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CountryPickerSheet
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
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
