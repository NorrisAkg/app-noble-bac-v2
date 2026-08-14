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
  await bounded(async () => {
    configure();
    await GoogleSignin.revokeAccess();
  });

  // Deuxième appel borné séparément, et non une suite du premier :
  // revokeAccess() échoue dès qu'aucun compte n'est connecté côté SDK — le cas
  // de tout utilisateur inscrit par téléphone — et cet échec ne doit pas
  // empêcher le nettoyage du cache local.
  await bounded(() => GoogleSignin.signOut());
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
function bounded(run: () => Promise<unknown>): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, FORGET_TIMEOUT_MS);
    run()
      .catch(() => {
        // Best-effort : compte non Google, SDK non configuré, réseau coupé.
      })
      .finally(() => {
        clearTimeout(timer);
        resolve();
      });
  });
}
