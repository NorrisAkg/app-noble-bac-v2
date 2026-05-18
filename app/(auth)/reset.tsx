import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { AppBar } from '@/components/ui/AppBar';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Eye, EyeOff } from 'lucide-react-native';
import { resetPassword } from '@/services/authService';
import { firebaseAuthService, FirebaseNotConfiguredError } from '@/services/firebaseAuthService';
import { getApiErrorMessage } from '@/utils/apiError';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();

  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    if (!phone) {
      Alert.alert('Erreur', 'Numéro de téléphone manquant.');
      router.back();
      return;
    }
    firebaseAuthService
      .sendVerificationCode(phone)
      .then(setVerificationId)
      .catch((e) => {
        setVerificationError(
          e instanceof FirebaseNotConfiguredError
            ? "Le service de vérification SMS n'est pas encore activé sur cette version. Revenez bientôt."
            : getApiErrorMessage(e),
        );
      });
  }, [phone]);

  const codeValid = code.length === 6;
  const passwordValid = password.length >= 8 && password === passwordConfirm;
  const isValid = codeValid && passwordValid && !!verificationId;

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (!verificationId) throw new FirebaseNotConfiguredError();
      const idToken = await firebaseAuthService.confirmVerificationCode(verificationId, code);
      return resetPassword({
        phone: String(phone),
        id_token: idToken,
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
      if (error instanceof FirebaseNotConfiguredError) {
        Alert.alert('Service indisponible', error.message);
        return;
      }
      Alert.alert('Échec', getApiErrorMessage(error));
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
            Saisis le code à 6 chiffres envoyé au {phone || ''}, puis choisis un nouveau mot de passe (8 caractères min).
          </Text>

          {verificationError && (
            <View className="bg-[#FBEDE8] border border-[#E14B36] rounded-xl p-3 mb-5">
              <Text className="font-poppins-semibold text-xs text-[#A93122] mb-0.5">
                Vérification SMS indisponible
              </Text>
              <Text className="font-poppins text-xs text-[#A93122] leading-4">
                {verificationError}
              </Text>
            </View>
          )}

          <Input
            label="Code SMS"
            placeholder="• • • • • •"
            keyboardType="number-pad"
            maxLength={6}
            value={code}
            onChangeText={setCode}
          />

          <Input
            label="Nouveau mot de passe"
            placeholder="8 caractères minimum"
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
            placeholder="••••••••"
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
