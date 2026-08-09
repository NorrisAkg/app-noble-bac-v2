import { QueryClient } from '@tanstack/react-query';

import { queryKeys } from '../lib/queryKeys';
import { prefetchAllData } from '../services/prefetchService';
import { catalogService } from '../services/catalogService';
import { courseService } from '../services/courseService';
import { quizService } from '../services/quizService';
import { getProfile } from '../services/profileService';
import { getCountries } from '../services/referentialService';

jest.mock('../services/catalogService');
jest.mock('../services/courseService');
jest.mock('../services/quizService');
jest.mock('../services/profileService');
jest.mock('../services/referentialService');

const mockedCourseService = courseService as jest.Mocked<typeof courseService>;
const mockedCatalogService = catalogService as jest.Mocked<typeof catalogService>;
const mockedQuizService = quizService as jest.Mocked<typeof quizService>;

const SNAPSHOT = [
  {
    id: 1,
    name: 'Mathématiques',
    chapters: [
      {
        id: 10,
        title: 'Chapitre 1',
        lessons: [{ id: 100, title: 'Leçon 1' }],
      },
    ],
  },
];

describe('prefetchAllData', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient();

    mockedCourseService.getSnapshot.mockResolvedValue(SNAPSHOT as never);
    mockedCatalogService.getExams.mockResolvedValue({ data: [] } as never);
    mockedCatalogService.getBooks.mockResolvedValue({ data: [] } as never);
    mockedQuizService.getHistory.mockResolvedValue({ data: [] } as never);
    (getProfile as jest.Mock).mockResolvedValue({ id: 1 });
    (getCountries as jest.Mock).mockResolvedValue([]);
  });

  /**
   * Le prefetch sème le cache avec setQueryData : s'il écrit sous une clé
   * qu'aucun écran ne lit, le warm-up offline est silencieusement perdu. Ce
   * test verrouille l'alignement sur le module queryKeys partagé — c'est
   * exactement ce qui avait dérivé quand la Bibliothèque lisait `['subjects']`
   * pendant que le prefetch écrivait `['courses','subjects']`.
   */
  it('sème le cache sous les mêmes clés que celles lues par les écrans', async () => {
    await prefetchAllData(queryClient);

    expect(queryClient.getQueryData(queryKeys.courses.subjects())).toHaveLength(1);
    expect(queryClient.getQueryData(queryKeys.courses.chapters(1))).toHaveLength(1);
    expect(queryClient.getQueryData(queryKeys.courses.lessons(10))).toHaveLength(1);
    expect(queryClient.getQueryData(queryKeys.courses.lesson(100))).toMatchObject({ id: 100 });
  });

  it('retire les sous-collections des entrées de liste', async () => {
    await prefetchAllData(queryClient);

    const subjects = queryClient.getQueryData(queryKeys.courses.subjects()) as Record<
      string,
      unknown
    >[];
    const chapters = queryClient.getQueryData(queryKeys.courses.chapters(1)) as Record<
      string,
      unknown
    >[];

    expect(subjects[0]).not.toHaveProperty('chapters');
    expect(chapters[0]).not.toHaveProperty('lessons');
  });

  it('préremplit le référentiel, le catalogue et l\'historique quiz', async () => {
    await prefetchAllData(queryClient);

    expect(queryClient.getQueryData(queryKeys.referential.countries())).toBeDefined();
    expect(queryClient.getQueryData(queryKeys.catalog.books())).toBeDefined();
    expect(queryClient.getQueryData(queryKeys.quiz.historyFirstPage())).toBeDefined();
  });

  it('ne jette pas quand le snapshot échoue', async () => {
    mockedCourseService.getSnapshot.mockRejectedValue(new Error('offline'));

    await expect(prefetchAllData(queryClient)).resolves.toBeUndefined();
    expect(queryClient.getQueryData(queryKeys.courses.subjects())).toBeUndefined();
  });
});
