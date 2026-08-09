import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { changePassword } from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';
import { getApiErrorMessage, getValidationErrors } from '@/utils/apiError';

const MIN_PASSWORD_LENGTH = 8;

/**
 * Écran bloquant imposé aux comptes créés avant la refonte, dont le mot de
 * passe est encore un PIN à 4 chiffres.
 *
 * Rendu en amont du `<Stack>` d'expo-router plutôt qu'en tant que route, pour
 * la même raison que ForceUpdateGate : une route resterait franchissable par
 * le bouton retour matériel ou une deep link, alors que le propre de cet écran
 * est d'être sans issue tant que le mot de passe n'a pas été changé.
 */
export function PasswordUpgradeGate() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearPasswordUpgrade = useAuthStore((s) => s.clearPasswordUpgrade);
  const logout = useAuthStore((s) => s.logout);

  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  const passwordsMatch = password.length > 0 && password === passwordConfirm;
  const isValid =
    currentPassword.length > 0 && password.length >= MIN_PASSWORD_LENGTH && passwordsMatch;

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      changePassword({
        current_password: currentPassword,
        password,
        password_confirmation: passwordConfirm,
      }),
    onSuccess: async (res) => {
      // Le backend a révoqué tous les credentials, y compris celui qui a servi
      // à faire l'appel : sans réécrire le couple renvoyé, la requête suivante
      // partirait avec un token mort.
      await setAuth(res.data.user, res.data.access_token, res.data.refresh_token, false);
      await clearPasswordUpgrade();
    },
    onError: (error) => {
      const validationErrors = getValidationErrors(error);
      if (Object.keys(validationErrors).length > 0) {
        setFieldErrors(validationErrors);
        return;
      }
      // Mot de passe actuel faux : 401, donc sans champ associé.
      setFormError(getApiErrorMessage(error));
    },
  });

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-6" keyboardShouldPersistTaps="handled">
          <View className="items-center mt-10 mb-6">
            <View className="w-[72px] h-[72px] rounded-full bg-brand-green/10 items-center justify-center mb-5">
              <ShieldCheck size={36} color="#3DBE45" />
            </View>
            <Text className="font-poppins-bold text-[22px] text-brand-ink text-center tracking-tighter">
              Sécurise ton compte
            </Text>
            <Text className="font-poppins text-[13.5px] text-brand-ink-medium text-center mt-2 leading-5">
              Ton code à 4 chiffres n&apos;est plus assez sûr maintenant que tu peux te connecter
              avec ton email. Choisis un mot de passe d&apos;au moins 8 caractères pour continuer.
            </Text>
          </View>

          <PasswordInput
            label="Code actuel"
            placeholder="Ton code à 4 chiffres"
            value={currentPassword}
            onChangeText={(v) => {
              setCurrentPassword(v);
              setFormError('');
              setFieldErrors((e) => ({ ...e, current_password: '' }));
            }}
            error={formError || fieldErrors.current_password || undefined}
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

          <View className="mt-2">
            <Button onPress={() => mutate()} disabled={!isValid} loading={isPending}>
              Enregistrer
            </Button>
          </View>

          {/* Seule sortie possible. Sans elle, un utilisateur ayant oublié son
              code serait enfermé dans cet écran, sans même pouvoir atteindre
              « mot de passe oublié » depuis l'écran de connexion. */}
          <View className="mt-5 mb-10">
            <Button variant="ghost" onPress={() => void logout()} disabled={isPending}>
              Me déconnecter
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
