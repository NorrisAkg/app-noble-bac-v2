import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { PremiumLockSheet } from '@/components/ui/PremiumLockSheet';

interface PremiumGateContextValue {
  /** Ouvre le sheet pour une ressource bloquée. Pas d'effet si déjà ouvert. */
  show: (resourceLabel?: string) => void;
  /** Ferme le sheet courant. */
  hide: () => void;
}

const PremiumGateContext = createContext<PremiumGateContextValue | null>(null);

/**
 * Provider racine du gating Premium. Rend une fois pour toute l'app le
 * PremiumLockSheet — n'importe quel écran peut l'ouvrir via `usePremiumGate()`
 * ou via le context direct `usePremiumGateContext()`.
 *
 * Doit être monté dans app/_layout.tsx à l'intérieur du QueryProvider (pour
 * que le hook usePremiumGate puisse interroger useQuery).
 */
export const PremiumGateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [lockedLabel, setLockedLabel] = useState<string | null>(null);

  const show = useCallback((resourceLabel?: string) => {
    setLockedLabel(resourceLabel ?? 'ce contenu');
  }, []);

  const hide = useCallback(() => {
    setLockedLabel(null);
  }, []);

  const handleUpgrade = useCallback(() => {
    router.push('/subscription-plans');
  }, [router]);

  const value = useMemo<PremiumGateContextValue>(() => ({ show, hide }), [show, hide]);

  return (
    <PremiumGateContext.Provider value={value}>
      {children}
      <PremiumLockSheet
        isOpen={lockedLabel !== null}
        resourceLabel={lockedLabel ?? undefined}
        onClose={hide}
        onUpgrade={handleUpgrade}
      />
    </PremiumGateContext.Provider>
  );
};

export function usePremiumGateContext(): PremiumGateContextValue {
  const ctx = useContext(PremiumGateContext);
  if (!ctx) {
    throw new Error('usePremiumGateContext must be used inside <PremiumGateProvider>');
  }
  return ctx;
}
