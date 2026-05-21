import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { AppBar } from '@/components/ui/AppBar';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { CountryFlag } from '@/components/ui/CountryFlag';
import { CountryPickerSheet } from '@/components/ui/CountryPickerSheet';
import { Eye, EyeOff, ChevronDown } from 'lucide-react-native';
import { login } from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';
import { getApiErrorMessage } from '@/utils/apiError';
import { buildE164Phone } from '@/utils/phone';
import { COUNTRIES, DEFAULT_COUNTRY, type Country } from '@/constants/countries';

export default function LoginScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  // Build the E.164 number — preserve leading zeros (UEMOA convention).
  const e164Phone = buildE164Phone(country.dial, phone);
  const isValid = phone.length >= 6 && password.length >= 4;

  const { mutate, isPending } = useMutation({
    mutationFn: () => login({ phone: e164Phone, password }),
    onSuccess: async (res) => {
      await setAuth(res.data.user, res.data.access_token, res.data.refresh_token);
      // Navigation handled by the auth guard in _layout.tsx
    },
    onError: (error) => {
      Alert.alert('Connexion échouée', getApiErrorMessage(error));
    },
  });

  return (
    <View className="flex-1 bg-background">
      <AppBar title="Connexion" onBack={() => router.back()} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-6 pt-7" keyboardShouldPersistTaps="handled">
          <Text className="font-poppins-bold text-2xl text-brand-ink tracking-tighter">
            Bon retour 👋
          </Text>
          <Text className="font-poppins text-sm text-brand-ink-medium mt-1.5 mb-6 leading-5">
            Connecte-toi pour reprendre tes révisions là où tu les as laissées.
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

          <Input
            label="Mot de passe"
            placeholder="••••••••"
            secureTextEntry={!showPwd}
            value={password}
            onChangeText={setPassword}
            icon={
              <TouchableOpacity onPress={() => setShowPwd((v) => !v)}>
                {showPwd ? <EyeOff size={20} color="#5A6470" /> : <Eye size={20} color="#5A6470" />}
              </TouchableOpacity>
            }
          />

          <TouchableOpacity
            className="self-end mb-6"
            onPress={() => router.push('/(auth)/forgot')}
          >
            <Text className="font-poppins-semibold text-xs text-brand-green">
              Mot de passe oublié ?
            </Text>
          </TouchableOpacity>

          <Button onPress={() => mutate()} disabled={!isValid} loading={isPending}>
            Se connecter
          </Button>

          <View className="mt-6 mb-10 flex-row justify-center gap-1">
            <Text className="font-poppins text-[13.5px] text-brand-ink-medium">Nouveau ici ?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
              <Text className="font-poppins-semibold text-[13.5px] text-brand-green">
                Créer un compte
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
