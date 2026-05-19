import { useEffect, useRef, useState } from 'react';

/**
 * Hook léger qui détermine si l'API est joignable. Pas de
 * `@react-native-community/netinfo` (évite l'ajout d'une dep native
 * mid-mission). Stratégie : ping de `/api/v1/health` toutes les
 * `POLL_INTERVAL_MS`.
 *
 * Limites :
 * - Ne détecte pas une connexion mobile sans débit utile (Wi-Fi
 *   captif, opérateur down) tant que `/health` répond.
 * - À remplacer par NetInfo + une migration EAS au prochain
 *   dev client build pour avoir une détection système native.
 */

const POLL_INTERVAL_MS = 30_000;
const TIMEOUT_MS = 5_000;

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost/api/v1';
const HEALTH_URL = `${API_URL.replace(/\/$/, '')}/health`;

async function pingHealth(): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const res = await fetch(HEALTH_URL, { signal: ctrl.signal });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const check = async () => {
      const ok = await pingHealth();
      if (mountedRef.current) setIsOnline(ok);
    };

    check();
    const id = setInterval(check, POLL_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      clearInterval(id);
    };
  }, []);

  return isOnline;
}
