import { useState } from 'react';
import { Alert } from 'react-native';

import { googleSignIn } from '@/services/authService';
import { GoogleSignInCancelled, signInWithGoogle } from '@/services/googleService';
import { useAuthStore } from '@/store/useAuthStore';
import { getApiErrorMessage, getValidationErrors } from '@/utils/apiError';

interface UseGoogleAuthOptions {
  /**
   * Pays à rattacher si le backend doit créer le compte. L'écran de connexion
   * ne le connaît pas ; l'écran d'inscription le tient de son sélecteur.
   */
  countryId?: string | null;
  /**
   * Appelé quand le backend exige un pays qu'on ne lui a pas fourni — cas
   * d'un nouvel utilisateur qui tape « Continuer avec Google » depuis l'écran
   * de connexion. À l'écran de le rediriger vers l'inscription.
   */
  onCountryRequired?: () => void;
}

/**
 * Parcours Google complet : fenêtre native → échange de l'id_token contre les
 * tokens applicatifs → hydratation du store.
 *
 * Partagé par les écrans de connexion et d'inscription : côté backend c'est le
 * même endpoint, et l'utilisateur n'a pas à savoir s'il possède déjà un compte.
 */
export function useGoogleAuth({ countryId, onCountryRequired }: UseGoogleAuthOptions = {}) {
  const setAuth = useAuthStore((s) => s.setAuth);
  const [isPending, setIsPending] = useState(false);

  const start = async () => {
    if (isPending) return;

    setIsPending(true);
    try {
      const idToken = await signInWithGoogle();

      const response = await googleSignIn({
        id_token: idToken,
        ...(countryId ? { country_id: countryId } : {}),
      });

      // La navigation est prise en charge par le garde d'auth de _layout.tsx
      // dès que le store passe à authentifié.
      await setAuth(
        response.data.user,
        response.data.access_token,
        response.data.refresh_token,
      );
    } catch (error) {
      // Fermeture volontaire de la fenêtre : aucune alerte, ce n'est pas un
      // échec du point de vue de l'utilisateur.
      if (error instanceof GoogleSignInCancelled) {
        return;
      }

      if (getValidationErrors(error).country_id && onCountryRequired) {
        onCountryRequired();
        return;
      }

      Alert.alert('Connexion Google échouée', getApiErrorMessage(error));
    } finally {
      setIsPending(false);
    }
  };

  return { start, isPending };
}
