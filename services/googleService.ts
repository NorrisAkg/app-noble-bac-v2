import {
  GoogleSignin,
  statusCodes,
  isErrorWithCode,
} from '@react-native-google-signin/google-signin';

/**
 * Levée quand l'utilisateur ferme lui-même la fenêtre Google. L'appelant doit
 * la traiter en silence : afficher une alerte « connexion échouée » alors que
 * l'utilisateur vient d'annuler volontairement est perçu comme un bug.
 */
export class GoogleSignInCancelled extends Error {
  constructor() {
    super('Connexion Google annulée.');
    this.name = 'GoogleSignInCancelled';
  }
}

let isConfigured = false;

/**
 * Configure le SDK. Idempotent : appelé au premier usage plutôt qu'au boot,
 * pour ne pas payer l'initialisation native sur un démarrage où personne ne
 * touchera au bouton Google.
 *
 * `webClientId` est bien le client OAuth **web**, pas le client Android : le
 * SDK Android émet un id_token dont l'audience est le client web, et c'est
 * cette audience que le backend vérifie.
 */
function configure(): void {
  if (isConfigured) return;

  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

  if (!webClientId) {
    throw new Error(
      'Connexion Google indisponible : EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID n\'est pas défini.',
    );
  }

  GoogleSignin.configure({
    webClientId,
    // Demande l'id_token, seule information dont le backend a besoin.
    offlineAccess: false,
  });

  isConfigured = true;
}

/**
 * Ouvre la fenêtre Google et renvoie l'id_token à transmettre au backend.
 *
 * On ne renvoie ni l'email ni le nom lus côté client : ils sont extraits par
 * le backend du token dont il a vérifié la signature. Faire confiance aux
 * valeurs remontées par le SDK laisserait un client modifié s'attribuer
 * l'adresse de quelqu'un d'autre.
 *
 * @throws GoogleSignInCancelled si l'utilisateur ferme la fenêtre
 */
export async function signInWithGoogle(): Promise<string> {
  configure();

  // Obligatoire sur Android : sans ce contrôle, l'appel échoue avec une
  // erreur native peu lisible sur un appareil sans Play Services à jour.
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  try {
    const response = await GoogleSignin.signIn();

    if (response.type === 'cancelled') {
      throw new GoogleSignInCancelled();
    }

    const idToken = response.data?.idToken;

    if (!idToken) {
      throw new Error('Google n\'a pas renvoyé de jeton d\'identité.');
    }

    return idToken;
  } catch (error) {
    if (error instanceof GoogleSignInCancelled) {
      throw error;
    }

    // Les versions récentes du SDK renvoient `type: 'cancelled'`, mais un
    // appareil peut encore remonter l'ancien code d'erreur.
    if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new GoogleSignInCancelled();
    }

    throw error;
  }
}

/**
 * Déconnecte le compte Google local. Sans ça, le SDK resélectionne
 * silencieusement le dernier compte utilisé : un utilisateur qui se déconnecte
 * pour changer de compte serait reconnecté sur le même.
 */
export async function signOutFromGoogle(): Promise<void> {
  try {
    await GoogleSignin.signOut();
  } catch {
    // Best-effort : l'échec ne doit pas bloquer la déconnexion applicative.
  }
}
