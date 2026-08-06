import { useEffect, useState } from 'react';

import { fetchAppVersion } from '@/services/appVersionService';

interface ForceUpdateState {
  /** true tant que la vérification est en cours. */
  isChecking: boolean;
  /** true ⇒ le binaire est plus ancien que la version minimale supportée. */
  mustUpdate: boolean;
  storeUrl: string | null;
}

/**
 * Interroge le contrat de compatibilité au démarrage.
 *
 * Fail-open : si l'appel échoue (réseau, API down), `mustUpdate` reste false.
 * Bloquer l'app parce que le serveur est injoignable serait pire que de
 * laisser tourner une version obsolète.
 */
export function useForceUpdate(): ForceUpdateState {
  const [state, setState] = useState<ForceUpdateState>({
    isChecking: true,
    mustUpdate: false,
    storeUrl: null,
  });

  useEffect(() => {
    let cancelled = false;

    fetchAppVersion().then((info) => {
      if (cancelled) return;
      setState({
        isChecking: false,
        mustUpdate: info?.force_update ?? false,
        storeUrl: info?.store_url ?? null,
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
