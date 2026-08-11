import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { AppBar } from '@/components/ui/AppBar';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { GoogleButton } from '@/components/ui/GoogleButton';
import { KeyboardAwareScreen } from '@/components/ui/KeyboardAwareScreen';
import { IdentifierField, IdentifierCountrySheet } from '@/components/auth/IdentifierField';
import { login, resendEmailCode, sendOtp } from '@/services/authService';
import { cancelAccountDeletion } from '@/services/accountService';
import { useAuthStore } from '@/store/useAuthStore';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useIdentifierInput } from '@/hooks/useIdentifierInput';
import {
  getApiErrorMessage,
  getPendingDeletionPurgeAt,
  getVerificationChannel,
} from '@/utils/apiError';
import { resolveVerificationTarget } from '@/utils/verification';

export default function LoginScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  // L'onglet email est celui par défaut : l'email est obligatoire à
  // l'inscription et le téléphone facultatif, la connexion par numéro ne sert
  // donc plus qu'aux comptes créés avant la refonte.
  const identity = useIdentifierInput('email');
  const identifier = identity.identifier;
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');

  // Aucune validation de format au-delà de « non vide » : le backend répond
  // 401 sur tout identifiant inconnu, et refuser une saisie ici reviendrait à
  // révéler quel format il attend.
  const isValid = identity.isFilled && password.length > 0;

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

  /**
   * Envoie un code sur le bon canal puis ouvre l'écran de vérification
   * correspondant. L'envoi précède la navigation : contrairement au parcours
   * d'inscription, aucun code n'a été émis ici, et l'écran s'ouvrirait sur un
   * compte à rebours de renvoi de 45 secondes sans rien à saisir.
   */
  const redirectToVerification = async (channel: 'email' | 'phone') => {
    const target = resolveVerificationTarget(channel, identifier);

    if (target.kind === 'unavailable') {
      setFormError(target.reason);
      return;
    }

    try {
      if (target.kind === 'email') {
        await resendEmailCode({ email: target.email });
        router.push({ pathname: '/(auth)/verify-email', params: { email: target.email } });
      } else {
        await sendOtp({ phone: target.phone });
        router.push({ pathname: '/(auth)/verify', params: { phone: target.phone } });
      }
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    }
  };

  /**
   * Compte en cours de suppression : le backend refuse la connexion en 403 et
   * transporte la date de purge. Sans cette branche, l'utilisateur verrait un
   * refus sans issue alors qu'il lui reste 30 jours pour se raviser.
   */
  const { mutate: cancelDeletion, isPending: isCancelling } = useMutation({
    mutationFn: () => cancelAccountDeletion({ identifier, password }),
    onSuccess: async (data) => {
      await setAuth(data.user, data.access_token, data.refresh_token);
    },
    onError: (error) => setFormError(getApiErrorMessage(error)),
  });

  const promptCancelDeletion = (purgeAt: string) => {
    const purgeDate = new Date(purgeAt).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    Alert.alert(
      'Compte en cours de suppression',
      `Ton compte sera définitivement supprimé le ${purgeDate}. Tu peux encore annuler et le récupérer intact.`,
      [
        { text: 'Laisser supprimer', style: 'cancel' },
        { text: 'Annuler la suppression', onPress: () => cancelDeletion() },
      ],
    );
  };

  const { mutate, isPending } = useMutation({
    mutationFn: () => login({ identifier, password }),
    onSuccess: async (res) => {
      // Le drapeau vient du backend : seul /auth/login voit le mot de passe en
      // clair et peut donc repérer un PIN historique.
      await setAuth(
        res.data.user,
        res.data.access_token,
        res.data.refresh_token,
        res.data.password_upgrade_required,
      );
      // Navigation prise en charge par le garde d'auth de _layout.tsx
    },
    onError: async (error) => {
      const purgeAt = getPendingDeletionPurgeAt(error);
      if (purgeAt) {
        promptCancelDeletion(purgeAt);
        return;
      }

      // Compte existant mais jamais vérifié : sans cette branche, l'utilisateur
      // recevait un 403 sans aucune issue — le mot de passe est bon, mais rien
      // ne le menait vers l'écran de vérification.
      const channel = getVerificationChannel(error);
      if (channel) {
        await redirectToVerification(channel);
        return;
      }

      // Affiché sous le champ plutôt qu'en Alert : l'erreur porte sur la
      // saisie, l'utilisateur doit la voir en même temps que ce qu'il a tapé.
      setFormError(getApiErrorMessage(error));
    },
  });

  return (
    <View className="flex-1 bg-background">
      <AppBar title="Connexion" onBack={() => router.back()} />

      <KeyboardAwareScreen className="flex-1 px-6 pt-7">
        <Text className="font-poppins-bold text-2xl text-brand-ink tracking-tighter">
          Bon retour 👋
        </Text>
        <Text className="font-poppins text-sm text-brand-ink-medium mt-1.5 mb-6 leading-5">
          Connecte-toi pour reprendre tes révisions là où tu les as laissées.
        </Text>

        <IdentifierField
          state={identity}
          onEdit={() => setFormError('')}
          phoneHelperText="Choisis ton pays, puis saisis ton numéro sans l'indicatif."
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

        <Button
          onPress={() => mutate()}
          disabled={!isValid}
          loading={isPending || isCancelling}
        >
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
      </KeyboardAwareScreen>

      {/* Hors du conteneur scrollable : la sheet couvre l'écran. */}
      <IdentifierCountrySheet state={identity} onEdit={() => setFormError('')} />
    </View>
  );
}
