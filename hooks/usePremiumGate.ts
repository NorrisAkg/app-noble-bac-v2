import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { getActiveSubscription } from '@/services/subscriptionService';
import { usePremiumGateContext } from '@/providers/PremiumGateProvider';

/**
 * Helper de calcul "is free" pour les ressources backend ayant un flag
 * `is_free`. Centralise les règles métier des modèles polymorphes :
 *
 *   - Lesson         → free si `is_free === true` OU `order === 1`
 *                      (RM-COURS-05 : la 1re leçon de chaque chapitre est gratuite)
 *   - RevisionSheet  → free si `is_free === true`
 *   - ChapterVideo   → free si `is_free === true`
 *   - Book           → free si `is_free === true`
 *   - Correction     → toujours Premium (RM-ACC-02)
 *   - QuizSession    → toujours Premium (RM-QUIZ-05)
 *   - Exam (épreuve) → toujours libre pour user connecté (vitrine RM-ACC-02)
 *
 * Pour les ressources sans flag dédié (corrigé, quiz), on passe explicitement
 * `{ is_free: false }`. Pour les épreuves, on n'appelle simplement pas guard.
 */
export interface Gatedresource {
  is_free?: boolean;
  order?: number;
  title?: string;
}

export function isResourceFree(resource: Gatedresource): boolean {
  if (resource.is_free === true) return true;
  if (resource.order === 1) return true;
  return false;
}

export interface PremiumGate {
  /** Vrai dès qu'une subscription active est detectee. */
  isPremium: boolean;
  /** Vrai pendant le premier fetch du status — les taps sont ignores. */
  isLoading: boolean;
  /**
   * Si `resource` est free ou si l'utilisateur est Premium → execute
   * `allowed()` et renvoie son resultat. Sinon → ouvre le PremiumLockSheet
   * via le provider et renvoie `undefined`.
   *
   * Pendant `isLoading` (premiere requete), le tap est absorbe pour eviter
   * de mal interpreter une absence de reponse comme Free.
   */
  guard<T>(resource: Gatedresource, allowed: () => T): T | undefined;
  /**
   * Ouvre le sheet manuellement. Utile pour les filets de securite tardifs
   * (un ecran qui apprend son 403 apres le fetch).
   */
  show(resourceLabel?: string): void;
}

/**
 * Hook central de gating Premium. S'appuie sur :
 * - `getActiveSubscription()` (cache 5 min via react-query)
 * - `PremiumGateProvider` au niveau racine (qui rend le sheet une fois)
 */
export function usePremiumGate(): PremiumGate {
  const { show } = usePremiumGateContext();

  const { data, isLoading } = useQuery({
    queryKey: ['subscription', 'active'],
    queryFn: getActiveSubscription,
    staleTime: 5 * 60 * 1000,
  });

  const isPremium = data?.status === 'active';

  const guard = useCallback(
    <T,>(resource: Gatedresource, allowed: () => T): T | undefined => {
      if (isLoading) return undefined;
      if (isResourceFree(resource) || isPremium) {
        return allowed();
      }
      show(resource.title);
      return undefined;
    },
    [isLoading, isPremium, show],
  );

  return { isPremium, isLoading, guard, show };
}
