import {
  GoogleSignin,
  statusCodes,
  isErrorWithCode,
} from '@react-native-google-signin/google-signin';

import { traceAuth } from './authTrace';

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
export function configure(): void {
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
 * Formate un message d'erreur explicite pour les échecs natifs de Google Sign-In.
 */
export function formatGoogleErrorMessage(error: unknown): string {
  if (error instanceof GoogleSignInCancelled) {
    return 'Connexion Google annulée.';
  }

  if (isErrorWithCode(error)) {
    const code = String(error.code);
    if (code === '10' || code === 'DEVELOPER_ERROR') {
      return 'Configuration Google incomplète (code 10). Vérifie l\'enregistrement de l\'empreinte SHA-1 de l\'application et du Web Client ID dans Google Cloud / Firebase.';
    }
    if (code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE || code === '2' || code === 'PLAY_SERVICES_NOT_AVAILABLE') {
      return 'Les services Google Play ne sont pas disponibles ou nécessitent une mise à jour sur cet appareil.';
    }
    if (code === statusCodes.SIGN_IN_CANCELLED || code === '12501' || code === 'SIGN_IN_CANCELLED') {
      return 'Connexion Google annulée.';
    }
    if (code === statusCodes.SIGN_IN_REQUIRED || code === '4' || code === 'SIGN_IN_REQUIRED') {
      return 'Connexion Google requise.';
    }
    if (code === '7' || code.toUpperCase().includes('NETWORK')) {
      return 'Impossible de joindre les serveurs Google. Vérifie ta connexion Internet.';
    }
    return `Erreur Google Sign-In (${code}) : ${error.message}`;
  }

  return error instanceof Error ? error.message : 'Erreur inconnue lors de la connexion Google.';
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

  // Un compte encore en cache à cet instant produit la reconnexion silencieuse.
  // On s'assure d'invalider la session précédente pour forcer le sélecteur de compte.
  const cachedAccount = GoogleSignin.getCurrentUser() !== null;
  traceAuth(`google.signIn : compte en cache avant ouverture = ${cachedAccount ? 'oui' : 'non'}`);

  if (cachedAccount) {
    await forgetGoogleAccount();
  } else {
    // Sécurité supplémentaire : même si getCurrentUser() est null en mémoire JS,
    // on purge la session native pour forcer l'Account Picker.
    try {
      await GoogleSignin.signOut();
    } catch {
      // Ignoré si aucun compte connecté
    }
  }

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
    if (isErrorWithCode(error) && (error.code === statusCodes.SIGN_IN_CANCELLED || String(error.code) === '12501')) {
      throw new GoogleSignInCancelled();
    }

    traceAuth(`google.signIn : échec — ${formatGoogleErrorMessage(error)}`);
    throw error;
  }
}

/**
 * Fait oublier le compte Google à l'appareil, pour que la prochaine connexion
 * repasse par le sélecteur de compte.
 *
 * `signOut()` seul ne suffit pas : il vide le cache local du SDK, mais
 * l'autorisation accordée par l'utilisateur à l'application reste enregistrée
 * chez Google. L'API Android historique utilisée par ce SDK ré-honore alors
 * cette autorisation au `signIn()` suivant, sans afficher la moindre fenêtre —
 * l'utilisateur qui se déconnecte pour changer de compte est reconnecté sur le
 * même, en silence. `revokeAccess()` révoque l'autorisation elle-même.
 */
export async function forgetGoogleAccount(): Promise<void> {
  // Le client natif doit être configuré pour que revokeAccess() ait une cible :
  // une session restaurée au démarrage n'est jamais passée par
  // signInWithGoogle(), donc jamais par configure().
  await bounded('revokeAccess', async () => {
    configure();
    await GoogleSignin.revokeAccess();
  });

  // Deuxième appel borné séparément, et non une suite du premier :
  // revokeAccess() échoue dès qu'aucun compte n'est connecté côté SDK — le cas
  // de tout utilisateur inscrit par téléphone — et cet échec ne doit pas
  // empêcher le nettoyage du cache local.
  await bounded('signOut', () => GoogleSignin.signOut());
}

/** Délai au-delà duquel on cesse d'attendre le SDK Google. */
const FORGET_TIMEOUT_MS = 4_000;

/**
 * Exécute un appel au SDK sans jamais rejeter ni dépasser FORGET_TIMEOUT_MS.
 *
 * `forgetGoogleAccount` est appelée depuis `clearLocal`, qui est le passage
 * obligé de toutes les fins de session — y compris celle, automatique, que
 * déclenche un 401. Un aller-retour réseau qui traîne y bloquerait l'effacement
 * de la session : l'utilisateur resterait sur un écran authentifié dont plus
 * aucune requête n'aboutit. Oublier le compte Google est souhaitable, pas
 * indispensable ; l'effacement de la session, lui, ne peut pas attendre.
 */
function bounded(label: string, run: () => Promise<unknown>): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      traceAuth(`google.${label} : pas de réponse après ${FORGET_TIMEOUT_MS} ms`);
      resolve();
    }, FORGET_TIMEOUT_MS);

    run()
      .then(() => traceAuth(`google.${label} : ok`))
      .catch((error: unknown) => {
        // Best-effort : compte non Google, SDK non configuré, réseau coupé.
        // La raison est tracée — c'est elle qui dira pourquoi le sélecteur de
        // compte ne revient pas si le symptôme survit.
        traceAuth(`google.${label} : échec — ${describeError(error)}`);
      })
      .finally(() => {
        clearTimeout(timer);
        resolve();
      });
  });
}

/** Message + code natif (`SIGN_IN_REQUIRED`, `NETWORK_ERROR`…), sans donnée personnelle. */
function describeError(error: unknown): string {
  if (isErrorWithCode(error)) {
    return `${error.code} ${error.message}`;
  }
  return error instanceof Error ? error.message : String(error);
}
