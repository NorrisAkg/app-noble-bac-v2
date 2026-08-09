import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { AppBar } from '@/components/ui/AppBar';
import { Button } from '@/components/ui/Button';
import { KeyboardAwareScreen } from '@/components/ui/KeyboardAwareScreen';
import { IdentifierField, IdentifierCountrySheet } from '@/components/auth/IdentifierField';
import { requestPasswordReset } from '@/services/authService';
import { useIdentifierInput } from '@/hooks/useIdentifierInput';
import { getApiErrorMessage } from '@/utils/apiError';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const identity = useIdentifierInput('email');
  const identifier = identity.identifier;

  const isValid = identity.isFilled;

  const { mutate, isPending } = useMutation({
    mutationFn: () => requestPasswordReset({ identifier }),
    onSuccess: () => {
      // Le backend répond 200 quel que soit le résultat, pour ne pas permettre
      // d'énumérer les comptes : on navigue donc inconditionnellement.
      router.push({ pathname: '/(auth)/reset', params: { identifier } });
    },
    onError: (error) => {
      Alert.alert('Erreur', getApiErrorMessage(error));
    },
  });

  return (
    <View className="flex-1 bg-background">
      <AppBar title="Mot de passe oublié" onBack={() => router.back()} />

      <KeyboardAwareScreen className="flex-1 px-6 pt-7">
        <Text className="font-poppins-bold text-2xl text-brand-ink tracking-tighter">
          Réinitialiser
        </Text>
        <Text className="font-poppins text-sm text-brand-ink-medium mt-1.5 mb-6 leading-5">
          Saisis l&apos;email ou le numéro associé à ton compte. Tu recevras un code à 6 chiffres
          pour confirmer ton identité.
        </Text>

        {/* Le canal suit l'identifiant saisi, pas les données du compte :
            il faut que l'utilisateur sache où regarder. */}
        <IdentifierField
          state={identity}
          emailHelperText="Le code arrive dans ta boîte mail."
          phoneHelperText="Le code arrive par SMS. Choisis ton pays, puis saisis ton numéro sans l'indicatif."
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
      </KeyboardAwareScreen>

      {/* Hors du conteneur scrollable : la sheet couvre l'écran. */}
      <IdentifierCountrySheet state={identity} />
    </View>
  );
}
