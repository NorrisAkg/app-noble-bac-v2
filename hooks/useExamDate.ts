import { useQuery } from '@tanstack/react-query';

import { getProfile } from '@/services/profileService';
import { getExamDate } from '@/services/referentialService';
import { queryKeys } from '@/lib/queryKeys';
import { isNotFound } from '@/utils/apiError';
import type { UserProfile } from '@/types/api';

export interface ExamCountdown {
  /** Jour du mois de l'épreuve (ex: 15), null si aucune date n'est connue. */
  day: number | null;
  /** Mois abrégé en français (ex: « juin »). */
  month: string | null;
  /** Année de la session (ex: 2027). */
  year: number | null;
  /** Jours restants tels que calculés par le serveur. */
  daysRemaining: number | null;
  isLoading: boolean;
}

/**
 * Convertit un `YYYY-MM-DD` en Date **locale**.
 *
 * `new Date('2027-06-15')` serait interprété en UTC par la spec ECMAScript et
 * afficherait le 14 juin à l'ouest de Greenwich — soit dans tous les pays de
 * l'UEMOA, qui sont en UTC ou UTC-1.
 */
function parseLocalDate(isoDate: string): Date | null {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

/**
 * Compte à rebours du BAC, alimenté par la date saisie dans le back-office
 * pour le **pays actif** de l'utilisateur.
 *
 * Partagé entre l'accueil et le plan d'étude : les deux écrans doivent afficher
 * le même chiffre, ce qui n'était pas le cas auparavant (l'un lisait le pays
 * actif, l'autre le pays d'inscription).
 *
 * Tant qu'aucune date n'est saisie pour ce pays, l'API répond 404 et tous les
 * champs valent null : à l'appelant de masquer le bloc plutôt que d'inventer
 * une date.
 */
export function useExamDate(): ExamCountdown {
  const profileQuery = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: getProfile,
    staleTime: 5 * 60 * 1000,
  });

  const countryId = profileQuery.data?.active_country.id ?? null;

  const examDateQuery = useQuery({
    queryKey: queryKeys.referential.examDate(countryId),
    queryFn: () => getExamDate(countryId!),
    enabled: countryId !== null,
    // La donnée ne bouge qu'une fois par an, et le serveur la sert déjà depuis
    // son propre cache.
    staleTime: 60 * 60 * 1000,
    // Un 404 est une absence assumée : la réessayer trois fois ne la ferait pas
    // apparaître, ça ne ferait que retarder l'affichage du reste de l'écran.
    retry: (failureCount, error) => !isNotFound(error) && failureCount < 2,
  });

  const examDate = examDateQuery.data;
  const parsed = examDate ? parseLocalDate(examDate.exam_date) : null;

  return {
    day: parsed?.getDate() ?? null,
    month: parsed?.toLocaleDateString('fr-FR', { month: 'short' }) ?? null,
    year: examDate?.year ?? null,
    // Valeur serveur, jamais recalculée : elle doit correspondre exactement à
    // la colonne « Jours restants » du back-office.
    daysRemaining: examDate?.days_remaining ?? null,
    isLoading: profileQuery.isLoading || examDateQuery.isLoading,
  };
}
