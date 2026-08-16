import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { googleSignIn } from '@/services/authService';
import { cancelAccountDeletion } from '@/services/accountService';
import {
  GoogleSignInCancelled,
  signInWithGoogle,
  formatGoogleErrorMessage,
} from '@/services/googleService';
import { useAuthStore } from '@/store/useAuthStore';
import {
  getApiErrorMessage,
  getPendingDeletionPurgeAt,
  getValidationErrors,
} from '@/utils/apiError';

interface UseGoogleAuthOptions {
  /**
   * Pays à rattacher si le backend doit créer le compte. L'écran de connexion
   * ne le connaît pas ; l'écran d'inscription le tient de son sélecteur.
   */
  countryId?: string | null;
  /**
   * Appelé quand le backend exige un pays qu'on ne lui a pas fourni — cas
   * d'un nouvel utilisateur qui tape « Continuer avec Google » depuis l'écran
   * de connexion. À l'écran de le rediriger vers l'inscription / choix du pays.
   */
  onCountryRequired?: () => void;
}

/**
 * Parcours Google complet : fenêtre native → échange de l'id_token contre les
 * tokens applicatifs → hydratation du store → onboarding si nouveau compte.
 *
 * Partagé par les écrans de connexion et d'inscription : côté backend c'est le
 * même endpoint, et l'utilisateur n'a pas à savoir s'il possède déjà un compte.
 */
export function useGoogleAuth({ countryId, onCountryRequired }: UseGoogleAuthOptions = {}) {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [isPending, setIsPending] = useState(false);

  const promptCancelDeletion = (purgeAt: string, idToken: string) => {
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
        {
          text: 'Annuler la suppression',
          onPress: async () => {
            try {
              setIsPending(true);
              const data = await cancelAccountDeletion({ google_id_token: idToken });
              await setAuth(data.user, data.access_token, data.refresh_token);
            } catch (err) {
              Alert.alert('Erreur', getApiErrorMessage(err));
            } finally {
              setIsPending(false);
            }
          },
        },
      ],
    );
  };

  const start = async () => {
    if (isPending) return;

    setIsPending(true);
    let idToken = '';
    try {
      idToken = await signInWithGoogle();

      const response = await googleSignIn({
        id_token: idToken,
        ...(countryId ? { country_id: countryId } : {}),
      });

      const isNewUser = Boolean(response.data.is_new_user);

      await setAuth(
        response.data.user,
        response.data.access_token,
        response.data.refresh_token,
        false,
        isNewUser,
      );

      if (isNewUser) {
        router.replace('/(auth)/congrats');
      } else {
        router.replace('/(tabs)');
      }
    } catch (error) {
      // Fermeture volontaire de la fenêtre : aucune alerte, ce n'est pas un
      // échec du point de vue de l'utilisateur.
      if (error instanceof GoogleSignInCancelled) {
        return;
      }

      const purgeAt = getPendingDeletionPurgeAt(error);
      if (purgeAt && idToken) {
        promptCancelDeletion(purgeAt, idToken);
        return;
      }

      if (getValidationErrors(error).country_id && onCountryRequired) {
        onCountryRequired();
        return;
      }

      const formatted = formatGoogleErrorMessage(error);
      const errorMessage = formatted !== 'Erreur inconnue lors de la connexion Google.'
        ? formatted
        : getApiErrorMessage(error);

      Alert.alert('Connexion Google échouée', errorMessage);
    } finally {
      setIsPending(false);
    }
  };

  return { start, isPending };
}
