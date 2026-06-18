import { QueryClient } from '@tanstack/react-query';

import { catalogService } from './catalogService';
import { courseService } from './courseService';
import { getProfile } from './profileService';
import { quizService } from './quizService';
import { getCountries } from './referentialService';

const DAY_MS = 1000 * 60 * 60 * 24;

/**
 * Pre-fetches all text/JSON data needed for offline use right after
 * authentication. The course snapshot (subjects + chapters + lessons)
 * is fetched in 3 SQL queries and then distributed into the individual
 * query cache keys so every screen finds its data already cached.
 *
 * Runs silently in the background — errors are swallowed so a failing
 * endpoint never blocks the user.
 */
export async function prefetchAllData(queryClient: QueryClient): Promise<void> {
  // 1. Course snapshot: subjects + chapters + full lesson content in one call.
  //    Populate individual cache keys so useQuery() calls find data immediately.
  // `.catch()` only guards against a rejected promise — a resolved but empty
  // body (`data: null`/`undefined`) would still slip through, so we normalise
  // to an array before touching `.length`.
  const snapshot = await courseService.getSnapshot().catch(() => []);
  const subjects = Array.isArray(snapshot) ? snapshot : [];

  if (subjects.length > 0) {
    // subjects list — matches ['courses', 'subjects'] query key
    queryClient.setQueryData(['courses', 'subjects'], subjects.map(({ chapters: _c, ...s }) => s));

    for (const subject of subjects) {
      // chapters per subject — matches ['courses', 'chapters', subjectId]
      queryClient.setQueryData(
        ['courses', 'chapters', subject.id],
        subject.chapters.map(({ lessons: _l, ...c }) => c),
      );

      for (const chapter of subject.chapters) {
        // lessons per chapter — matches ['courses', 'lessons', chapterId]
        queryClient.setQueryData(['courses', 'lessons', chapter.id], chapter.lessons);

        // lesson detail per lesson — matches ['courses', 'lesson', lessonId] (course-reader.tsx)
        for (const lesson of chapter.lessons) {
          queryClient.setQueryData(['courses', 'lesson', lesson.id], lesson);
        }
      }
    }
  }

  // 2. Everything else in parallel (non-blocking)
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
  ]);
}
