import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { AppBar } from '@/components/ui/AppBar';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Eye, EyeOff } from 'lucide-react-native';
import { resetPassword } from '@/services/authService';
import { otpService, OtpError } from '@/services/otpService';
import { getApiErrorMessage } from '@/utils/apiError';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();

  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  // The OTP was dispatched by /auth/password/request-reset in forgot.tsx.
  // On mount we just log the bypass hint (no-op in production).
  useEffect(() => {
    if (!phone) {
      Alert.alert('Erreur', 'Numéro de téléphone manquant.');
      router.back();
      return;
    }
    otpService.acknowledgeOtpSent(String(phone));
  }, [phone, router]);

  const codeValid = code.length === 6;
  const passwordValid = password.length === 4 && password === passwordConfirm;
  const isValid = codeValid && passwordValid;

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const validatedCode = otpService.validateCode(code);
      return resetPassword({
        phone: String(phone),
        code: validatedCode,
        password,
        password_confirmation: passwordConfirm,
      });
    },
    onSuccess: () => {
      Alert.alert(
        'Mot de passe mis à jour',
        'Tu peux maintenant te connecter avec ton nouveau mot de passe.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }],
      );
    },
    onError: (error) => {
      const message = error instanceof OtpError
        ? error.message
        : getApiErrorMessage(error);
      Alert.alert('Échec', message);
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
            Vérification + nouveau mot de passe
          </Text>
          <Text className="font-poppins text-sm text-brand-ink-medium mt-1.5 mb-6 leading-5">
            Saisis le code à 6 chiffres reçu sur WhatsApp au {phone || ''}, puis choisis un nouveau code PIN à 4 chiffres.
          </Text>

          <Input
            label="Code WhatsApp"
            placeholder="• • • • • •"
            keyboardType="number-pad"
            maxLength={6}
            value={code}
            onChangeText={setCode}
          />

          <Input
            label="Nouveau mot de passe"
            placeholder="• • • •"
            keyboardType="number-pad"
            maxLength={4}
            secureTextEntry={!showPwd}
            value={password}
            onChangeText={setPassword}
            icon={
              <TouchableOpacity onPress={() => setShowPwd((v) => !v)}>
                {showPwd ? <EyeOff size={20} color="#5A6470" /> : <Eye size={20} color="#5A6470" />}
              </TouchableOpacity>
            }
          />

          <Input
            label="Confirmer le mot de passe"
            placeholder="• • • •"
            keyboardType="number-pad"
            maxLength={4}
            secureTextEntry={!showPwd}
            value={passwordConfirm}
            onChangeText={setPasswordConfirm}
          />

          {password.length > 0 && password !== passwordConfirm && passwordConfirm.length > 0 && (
            <Text className="font-poppins text-xs text-[#A93122] mb-2">
              Les mots de passe ne correspondent pas.
            </Text>
          )}

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
