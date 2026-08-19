import type { QueryClient } from '@tanstack/react-query';

/**
 * Clés React Query centralisées.
 *
 * Avant ce module, les clés étaient déclarées inline dans chaque écran, ce qui
 * a produit des doublons silencieux : les matières vivaient sous `['subjects']`
 * (Bibliothèque, Recherche) ET `['courses','subjects']` (onglet Cours +
 * prefetch), les pays sous `['countries']` ET `['referential','countries']`,
 * l'abonnement actif sous `['subscription','active']` ET
 * `['active-subscription']`. Deux entrées de cache pour une même donnée : le
 * prefetch de démarrage rafraîchissait une copie que les écrans ne lisaient
 * pas, et `['subjects']` recevait deux `staleTime` contradictoires (24 h en
 * Bibliothèque, 10 min en Recherche) — le gagnant dépendait de l'ordre de
 * montage.
 *
 * Toute nouvelle clé passe par ici.
 */
export const queryKeys = {
  /** Référentiel : servi par l'API derrière un cache Redis busté à l'écriture admin. */
  referential: {
    all: () => ['referential'] as const,
    countries: () => ['referential', 'countries'] as const,
    operators: (countryId: number | string | null | undefined) =>
      ['referential', 'operators', countryId] as const,
    examDate: (countryId: number | string | null | undefined) =>
      ['referential', 'exam-date', countryId] as const,
    subjectsForSeries: (seriesId: number | string | null | undefined) =>
      ['referential', 'subjects-for-series', seriesId] as const,
  },

  /** Contenu pédagogique — GET /courses/*, lu en direct en base côté API. */
  courses: {
    all: () => ['courses'] as const,
    subjects: () => ['courses', 'subjects'] as const,
    chapters: (subjectId: number | string | undefined) =>
      ['courses', 'chapters', subjectId] as const,
    lessons: (chapterId: number | string | undefined) =>
      ['courses', 'lessons', chapterId] as const,
    lesson: (lessonId: number | string | undefined) => ['courses', 'lesson', lessonId] as const,
    revisionSheets: (chapterId: number | string | undefined) =>
      ['courses', 'revision-sheets', chapterId] as const,
    chapterVideos: (chapterId: number | string | undefined) =>
      ['courses', 'chapter-videos', chapterId] as const,
    chapterVideo: (videoId: number | string | undefined) =>
      ['courses', 'chapter-video', videoId] as const,
  },

  /** Catalogue BAC — épreuves, corrigés, livres, vidéos. */
  catalog: {
    all: () => ['catalog'] as const,
    exams: (filters?: Record<string, unknown>) =>
      (filters ? ['catalog', 'exams', filters] : ['catalog', 'exams']) as readonly unknown[],
    books: () => ['catalog', 'books'] as const,
    videos: (examId: number | string | undefined) => ['catalog', 'videos', examId] as const,
  },

  /**
   * Quiz. `quiz.subjects` interroge GET /quiz/subjects — un endpoint distinct
   * de GET /courses/subjects, avec son propre filtrage : les deux clés sont
   * légitimement séparées et ne doivent pas être fusionnées.
   */
  quiz: {
    all: () => ['quiz'] as const,
    subjects: () => ['quiz', 'subjects'] as const,
    chapters: (subjectId: number) => ['quiz', 'chapters', subjectId] as const,
    historyFirstPage: () => ['quiz', 'history', 'first-page'] as const,
    historyForSubject: (subjectId: number) => ['quiz', 'history', 'subject', subjectId] as const,
  },

  /** Abonnement et paiement. */
  subscription: {
    all: () => ['subscription'] as const,
    active: () => ['subscription', 'active'] as const,
    plans: () => ['subscription', 'plans'] as const,
    transactions: () => ['subscription', 'transactions'] as const,
  },
} as const;

/**
 * Préfixes invalidés quand l'app repasse au premier plan ou retrouve le réseau
 * après une coupure : tout ce qu'un admin peut modifier depuis Filament.
 *
 * Volontairement absents : profil, abonnement, téléchargements et
 * notifications, déjà invalidés séparément par leurs propres flux.
 */
export const ADMIN_MANAGED_QUERY_PREFIXES: readonly (readonly unknown[])[] = [
  queryKeys.referential.all(),
  queryKeys.courses.all(),
  queryKeys.catalog.all(),
  queryKeys.quiz.all(),
  ['home'],
];

/**
 * Invalide tout le contenu éditable en back-office.
 *
 * À préférer au pont `focusManager` de QueryProvider : ce dernier ne relance
 * que les requêtes déjà stale ET dotées d'un observateur actif, alors qu'une
 * invalidation explicite force le refetch quelle que soit la fenêtre de
 * fraîcheur — y compris pour les accordéons repliés (`enabled: false`), qui
 * repartiront en réseau à leur prochaine ouverture.
 */
export function invalidateAdminManagedQueries(queryClient: QueryClient): void {
  for (const prefix of ADMIN_MANAGED_QUERY_PREFIXES) {
    queryClient.invalidateQueries({ queryKey: prefix });
  }
}
