import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import CourseReaderScreen from '@/app/course-reader';
import { courseService } from '@/services/courseService';
import { queryKeys } from '@/lib/queryKeys';

jest.mock('@/services/courseService');
jest.mock('@/services/meService', () => ({ upsertLastRead: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@/hooks/usePremiumGate', () => ({
  usePremiumGate: () => ({ show: jest.fn(), guard: jest.fn(), isPremium: true }),
  isResourceFree: () => true,
}));
jest.mock('react-native-webview', () => ({ WebView: () => null }));
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), canGoBack: () => true, push: jest.fn() }),
  // Les params de route d'expo-router sont TOUJOURS des strings, y compris pour
  // un id numérique poussé via `String(lesson.id)` depuis l'onglet Cours.
  useLocalSearchParams: () => ({ lessonId: '100', subject: 'Maths' }),
}));

const mockedGetLesson = courseService.getLesson as jest.MockedFunction<
  typeof courseService.getLesson
>;

const safeAreaMetrics: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function makeWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <SafeAreaProvider initialMetrics={safeAreaMetrics}>
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      </SafeAreaProvider>
    );
  };
}

describe('CourseReaderScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * L'écran construisait sa clé depuis le param de route brut — donc
   * `['courses','lesson','100']` — alors que le snapshot de prefetch écrit
   * `['courses','lesson',100]` (id numérique, cf. prefetchService.test.ts).
   * Deux entrées de cache distinctes : le contenu préchargé pour l'offline
   * n'était jamais lu, et chaque ouverture laissait une entrée fantôme de plus
   * dans le cache persisté (15 jours de rétention).
   */
  it('lit la leçon préchargée par le snapshot malgré un id de route en string', async () => {
    // `staleTime` reproduit la fenêtre de fraîcheur réelle (5 min côté
    // QueryProvider) : le snapshot vient d'écrire l'entrée, elle est fresh,
    // donc un cache touché se voit à l'absence totale d'appel réseau.
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    client.setQueryData(queryKeys.courses.lesson(100), {
      id: 100,
      title: 'Leçon préchargée',
      html_url: 'https://r2.test/lesson-100.html',
    });

    render(<CourseReaderScreen />, { wrapper: makeWrapper(client) });

    // L'écran s'abonne à la clé numérique, celle qu'écrit le prefetch.
    await waitFor(() => {
      const cached = client
        .getQueryCache()
        .find({ queryKey: queryKeys.courses.lesson(100), exact: true });
      expect(cached?.getObserversCount()).toBeGreaterThan(0);
    });

    expect(mockedGetLesson).not.toHaveBeenCalled();
    // Et aucune entrée fantôme sous la clé string.
    expect(
      client.getQueryCache().find({ queryKey: queryKeys.courses.lesson('100'), exact: true }),
    ).toBeUndefined();
  });

  it('interroge l\'API avec un id numérique quand le cache est vide', async () => {
    mockedGetLesson.mockResolvedValue({
      id: 100,
      title: 'Leçon',
      html_url: 'https://r2.test/lesson-100.html',
    } as never);

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(<CourseReaderScreen />, { wrapper: makeWrapper(client) });

    await waitFor(() => expect(mockedGetLesson).toHaveBeenCalledWith(100));
    expect(client.getQueryData(queryKeys.courses.lesson(100))).toMatchObject({ id: 100 });
  });
});
