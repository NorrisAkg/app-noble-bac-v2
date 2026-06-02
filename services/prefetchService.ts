import { QueryClient } from '@tanstack/react-query';

import { catalogService } from './catalogService';
import { courseService } from './courseService';
import { getProfile } from './profileService';
import { quizService } from './quizService';
import { getCountries } from './referentialService';

const DAY_MS = 1000 * 60 * 60 * 24;

/**
 * Pre-fetches all text/JSON data needed for offline use right after
 * authentication. Runs silently in the background — errors are swallowed
 * so a failing endpoint never blocks the user.
 *
 * Subjects are fetched first (sequential), then all chapter lists are
 * fired in parallel alongside the other endpoints.
 */
export async function prefetchAllData(queryClient: QueryClient): Promise<void> {
  // 1. Subjects first — needed to fan out chapter prefetches
  const subjects = await queryClient
    .fetchQuery({
      queryKey: ['courses', 'subjects'],
      queryFn: courseService.getSubjects,
      staleTime: DAY_MS,
    })
    .catch(() => []);

  // 2. Everything else in parallel
  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: ['profile'],
      queryFn: getProfile,
    }),
    queryClient.prefetchQuery({
      queryKey: ['referential', 'countries'],
      queryFn: getCountries,
      staleTime: DAY_MS,
    }),
    queryClient.prefetchQuery({
      queryKey: ['catalog', 'exams'],
      queryFn: () => catalogService.getExams(),
    }),
    queryClient.prefetchQuery({
      queryKey: ['catalog', 'books'],
      queryFn: () => catalogService.getBooks(),
    }),
    queryClient.prefetchQuery({
      queryKey: ['quiz', 'history', 'first-page'],
      queryFn: () => quizService.getHistory(1, 20),
    }),
    ...subjects.map((s) =>
      queryClient.prefetchQuery({
        queryKey: ['courses', 'chapters', s.id],
        queryFn: () => courseService.getChapters(s.id),
      }),
    ),
  ]);
}
