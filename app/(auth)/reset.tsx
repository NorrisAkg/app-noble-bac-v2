import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { AppBar } from '@/components/ui/AppBar';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { KeyboardAwareScreen } from '@/components/ui/KeyboardAwareScreen';
import { requestPasswordReset, resetPassword } from '@/services/authService';
import { getApiErrorMessage, getValidationErrors } from '@/utils/apiError';

const CODE_LENGTH = 6;
const MIN_PASSWORD_LENGTH = 8;
const RESEND_DELAY_SECONDS = 45;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { identifier: rawIdentifier } = useLocalSearchParams<{ identifier?: string }>();
  const identifier = typeof rawIdentifier === 'string' ? rawIdentifier : '';

  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [resendIn, setResendIn] = useState(RESEND_DELAY_SECONDS);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendConfirmed, setResendConfirmed] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!identifier) {
      Alert.alert('Erreur', 'Identifiant manquant.');
      router.back();
    }
  }, [identifier, router]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setInterval(() => setResendIn((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [resendIn]);

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

  const handleResend = useCallback(async () => {
    if (!identifier || isResending) return;

    setCode('');
    setResendIn(RESEND_DELAY_SECONDS);
    setIsResending(true);
    setResendError(null);
    setResendConfirmed(false);

    try {
      await requestPasswordReset({ identifier });
      // Le backend répond 200 que le compte existe ou non (anti-énumération) :
      // on ne peut pas affirmer qu'un code est parti, seulement que la demande
      // est passée. Le message reste volontairement conditionnel.
      setResendConfirmed(true);
    } catch (e) {
      setResendError(getApiErrorMessage(e));
    } finally {
      setIsResending(false);
    }
  }, [identifier, isResending]);

  return (
    <View className="flex-1 bg-background">
      <AppBar title="Nouveau mot de passe" onBack={() => router.back()} />

      <KeyboardAwareScreen className="flex-1 px-6 pt-7">
        <Text className="font-poppins-bold text-2xl text-brand-ink tracking-tighter">
          Vérification et nouveau mot de passe
        </Text>
        <Text className="font-poppins text-sm text-brand-ink-medium mt-1.5 mb-6 leading-5">
          Saisis le code à 6 chiffres envoyé à{' '}
          <Text className="font-poppins-medium">{identifier}</Text>, puis choisis un nouveau mot
          de passe. Pense à regarder dans tes spams.
        </Text>

        {isResending && (
          <View className="flex-row items-center gap-2 mb-4">
            <ActivityIndicator size="small" color="#3DBE45" />
            <Text className="font-poppins text-xs text-brand-ink-medium">
              Envoi du code en cours…
            </Text>
          </View>
        )}

        {resendConfirmed && !isResending && (
          <Text className="font-poppins text-xs text-brand-ink-medium mb-4 leading-4">
            Si un compte correspond à cet identifiant, un nouveau code vient d&apos;être envoyé.
          </Text>
        )}

        {resendError && (
          <View className="bg-brand-danger-soft border border-brand-danger rounded-xl p-3 mb-4">
            <Text className="font-poppins-semibold text-xs text-brand-danger mb-0.5">
              Envoi impossible
            </Text>
            <Text className="font-poppins text-xs text-brand-danger leading-4">{resendError}</Text>
          </View>
        )}

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
          {resendIn > 0 ? (
            <Text className="font-poppins-semibold text-[13.5px] text-[#B8BDC4]">
              Renvoyer ({resendIn}s)
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend} disabled={isResending}>
              <Text className="font-poppins-semibold text-[13.5px] text-brand-green">
                Renvoyer le code
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAwareScreen>
    </View>
  );
}
