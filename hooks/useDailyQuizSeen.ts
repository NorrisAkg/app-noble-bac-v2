import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'daily_quiz_answered_v1';

/**
 * Mémorise localement que le quiz éclair du jour a été répondu : la valeur
 * stockée est la date du jour (YYYY-MM-DD). Le bloc reste masqué jusqu'au
 * lendemain, même après redémarrage de l'app, et réapparaît automatiquement
 * quand `today` change.
 *
 * `seen` est un snapshot lu au montage : `markSeen()` persiste sans le muter,
 * afin que la carte gère elle-même le fondu de sortie sans être démontée
 * brutalement par le parent en pleine session.
 */
export function useDailyQuizSeen(today: string) {
  const [seen, setSeen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => setSeen(raw === today))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [today]);

  const markSeen = useCallback(() => {
    AsyncStorage.setItem(STORAGE_KEY, today).catch(() => {});
  }, [today]);

  return { seen, loaded, markSeen };
}
