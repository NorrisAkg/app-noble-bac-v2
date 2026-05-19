import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Préférences offline — aligné `templates/screens-offline.jsx:71-86`.
 *
 * **Limite backend** : pas d'endpoint `/me/preferences`
 * (cf. `docs/BACKEND_GAPS.md` section 7.2). Stockage local en
 * AsyncStorage. À migrer vers le backend dès que l'endpoint sera
 * livré, pour synchroniser entre devices.
 */

const STORAGE_KEY = 'offline_preferences_v1';

export interface OfflinePreferences {
  /** Si vrai, refuse les téléchargements hors Wi-Fi. */
  wifiOnly: boolean;
  /** Si vrai, télécharge automatiquement les nouveaux contenus disponibles. */
  autoDownload: boolean;
}

const DEFAULT_PREFS: OfflinePreferences = {
  wifiOnly: true,
  autoDownload: false,
};

export function useOfflinePreferences() {
  const [prefs, setPrefs] = useState<OfflinePreferences>(DEFAULT_PREFS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<OfflinePreferences>;
          setPrefs({ ...DEFAULT_PREFS, ...parsed });
        }
      } catch {
        // Silencieux : on retombe sur les defaults.
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const update = useCallback(async (patch: Partial<OfflinePreferences>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {
        // ignore : changement local applique quand même
      });
      return next;
    });
  }, []);

  return { prefs, update, loaded };
}
