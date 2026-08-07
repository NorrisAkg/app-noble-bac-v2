import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { AppBar } from '@/components/ui/AppBar';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { resetPassword } from '@/services/authService';
import { getApiErrorMessage, getValidationErrors } from '@/utils/apiError';

const CODE_LENGTH = 6;
const MIN_PASSWORD_LENGTH = 8;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { identifier: rawIdentifier } = useLocalSearchParams<{ identifier?: string }>();
  const identifier = typeof rawIdentifier === 'string' ? rawIdentifier : '';

  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!identifier) {
      Alert.alert('Erreur', 'Identifiant manquant.');
      router.back();
    }
  }, [identifier, router]);

  const passwordsMatch = password.length > 0 && password === passwordConfirm;
  const isValid =
    code.length === CODE_LENGTH && password.length >= MIN_PASSWORD_LENGTH && passwordsMatch;

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      resetPassword({
        identifier,
        code,
        password,
        password_confirmation: passwordConfirm,
      }),
    onSuccess: () => {
      Alert.alert(
        'Mot de passe mis à jour',
        'Tu peux maintenant te connecter avec ton nouveau mot de passe.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }],
      );
    },
    onError: (error) => {
      const validationErrors = getValidationErrors(error);
      if (Object.keys(validationErrors).length > 0) {
        setFieldErrors(validationErrors);
      } else {
        // Un code invalide remonte en 401, pas en 422 : il n'a donc pas de
        // champ associé et doit passer par une alerte.
        Alert.alert('Échec', getApiErrorMessage(error));
      }
    },
  });

  return (
    <View className="flex-1 bg-background">
      <AppBar title="Nouveau mot de passe" onBack={() => router.back()} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-6 pt-7" keyboardShouldPersistTaps="handled">
          <Text className="font-poppins-bold text-2xl text-brand-ink tracking-tighter">
            Vérification et nouveau mot de passe
          </Text>
          <Text className="font-poppins text-sm text-brand-ink-medium mt-1.5 mb-6 leading-5">
            Saisis le code à 6 chiffres envoyé à{' '}
            <Text className="font-poppins-medium">{identifier}</Text>, puis choisis un nouveau mot
            de passe.
          </Text>

          <Input
            label="Code de vérification"
            placeholder="• • • • • •"
            keyboardType="number-pad"
            maxLength={CODE_LENGTH}
            value={code}
            onChangeText={(v) => {
              setCode(v);
              setFieldErrors((e) => ({ ...e, code: '' }));
            }}
            error={fieldErrors.code || undefined}
          />

          <PasswordInput
            label="Nouveau mot de passe"
            placeholder="8 caractères minimum"
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              setFieldErrors((e) => ({ ...e, password: '' }));
            }}
            error={fieldErrors.password || undefined}
          />

          <PasswordInput
            label="Confirme le mot de passe"
            placeholder="Retape ton mot de passe"
            value={passwordConfirm}
            onChangeText={setPasswordConfirm}
            error={
              passwordConfirm.length > 0 && !passwordsMatch
                ? 'Les deux mots de passe ne correspondent pas.'
                : undefined
            }
          />

          <View className="mt-4">
            <Button onPress={() => mutate()} disabled={!isValid} loading={isPending}>
              Mettre à jour le mot de passe
            </Button>
          </View>

          <View className="mt-6 mb-10 flex-row justify-center gap-1">
            <Text className="font-poppins text-[13.5px] text-brand-ink-medium">
              Pas de code reçu ?
            </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="font-poppins-semibold text-[13.5px] text-brand-green">
                Réessayer
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
