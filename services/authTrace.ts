import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Journal de bord du cycle de vie de la session, lisible depuis l'appareil.
 *
 * Instrumentation temporaire. Deux défauts du parcours Google survivent aux
 * correctifs et aucun des deux n'est explicable par la lecture du code : il
 * manque à chaque fois un fait que seul l'appareil détient — quelle requête
 * reçoit le premier 401, et pourquoi la révocation du compte Google ne rend pas
 * le sélecteur. `adb logcat` répondrait, mais n'est pas disponible ici, d'où ce
 * journal consultable depuis l'écran d'accueil (appui long sur « Commencer »).
 *
 * À supprimer une fois les deux causes nommées.
 */

const STORAGE_KEY = 'auth_trace';
const MAX_EVENTS = 40;

let events: string[] = [];
let loaded = false;

function stamp(): string {
  return new Date().toISOString().slice(11, 19);
}

/**
 * Enregistre un évènement. Volontairement synchrone du point de vue de
 * l'appelant : la persistance est un effet de bord best-effort, personne ne doit
 * attendre le journal — surtout pas les chemins de déconnexion.
 */
export function traceAuth(message: string): void {
  const line = `${stamp()} ${message}`;
  events = [...events, line].slice(-MAX_EVENTS);
  console.warn(`[auth] ${line}`);

  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(events)).catch(() => {
    // Le journal reste en mémoire : suffisant tant que l'app ne redémarre pas.
  });
}

/**
 * Recharge le journal persisté. Appelé au boot pour que les évènements d'une
 * session précédente survivent à un redémarrage de l'app.
 */
export async function loadAuthTrace(): Promise<void> {
  if (loaded) return;
  loaded = true;

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const stored: unknown = JSON.parse(raw);
    if (Array.isArray(stored)) {
      // Les évènements déjà enregistrés dans ce process passent après ceux du
      // disque : l'ordre chronologique est ce qu'on vient lire.
      events = [...stored.filter((e): e is string => typeof e === 'string'), ...events].slice(
        -MAX_EVENTS,
      );
    }
  } catch {
    // Journal illisible : on repart d'une page blanche plutôt que d'échouer.
  }
}

export function getAuthTrace(): string[] {
  return events;
}

export async function clearAuthTrace(): Promise<void> {
  events = [];
  await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {
    // idem
  });
}
