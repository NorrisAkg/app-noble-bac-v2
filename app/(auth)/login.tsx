import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { AppBar } from '@/components/ui/AppBar';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { GoogleButton } from '@/components/ui/GoogleButton';
import { login } from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { getApiErrorMessage } from '@/utils/apiError';

export default function LoginScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');

  // Aucune validation de format sur l'identifiant : le backend accepte un
  // email ou un numéro E.164 et répond 401 sur tout le reste. Refuser une
  // saisie ici reviendrait à révéler quel format il attend, et bloquerait les
  // comptes historiques qui se connectent par téléphone.
  const isValid = identifier.trim().length > 0 && password.length > 0;

  const google = useGoogleAuth({
    onCountryRequired: () => {
      Alert.alert(
        'Compte introuvable',
        'Aucun compte n\'est associé à ce compte Google. Crée ton compte pour choisir ton pays.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Créer un compte', onPress: () => router.push('/(auth)/signup') },
        ],
      );
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: () => login({ identifier: identifier.trim(), password }),
    onSuccess: async (res) => {
      await setAuth(res.data.user, res.data.access_token, res.data.refresh_token);
      // Navigation prise en charge par le garde d'auth de _layout.tsx
    },
    onError: (error) => {
      // Affiché sous le champ plutôt qu'en Alert : l'erreur porte sur la
      // saisie, l'utilisateur doit la voir en même temps que ce qu'il a tapé.
      setFormError(getApiErrorMessage(error));
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
            label="Email ou téléphone"
            placeholder="toi@exemple.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            value={identifier}
            onChangeText={(v) => {
              setIdentifier(v);
              setFormError('');
            }}
          />

          <PasswordInput
            label="Mot de passe"
            placeholder="Ton mot de passe"
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              setFormError('');
            }}
            error={formError || undefined}
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

          {/* ── Séparateur ── */}
          <View className="flex-row items-center my-5">
            <View className="flex-1 h-[1px] bg-line" />
            <Text className="font-poppins text-xs text-brand-ink-medium mx-3">ou</Text>
            <View className="flex-1 h-[1px] bg-line" />
          </View>

          <GoogleButton onPress={google.start} loading={google.isPending} disabled={isPending} />

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
    </View>
  );
}
