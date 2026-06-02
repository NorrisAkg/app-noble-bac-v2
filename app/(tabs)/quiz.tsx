import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { courseService } from '@/services/courseService';
import { quizService, type QuizSessionHistoryItem } from '@/services/quizService';
import { SubjectIcon, backendSlugToSubjectKind } from '@/components/ui/SubjectIcon';
import { EmptyState } from '@/components/ui/EmptyState';
import { IllustrationEmptyCourses } from '@/components/ui/EmptyIllustrations';
import { C } from '@/constants/theme';
import { usePremiumGate } from '@/hooks/usePremiumGate';
import type { Subject } from '@/types/api';

interface SubjectQuizStats {
  sessions: number;
  averagePct: number | null;
}

export default function QuizSubjectsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const subjectsQuery = useQuery({
    queryKey: ['courses', 'subjects'],
    queryFn: courseService.getSubjects,
    staleTime: 24 * 60 * 60 * 1000,
  });
  const subjects: Subject[] = subjectsQuery.data ?? [];
  const loading = subjectsQuery.isLoading;

  const historyQuery = useQuery({
    queryKey: ['quiz', 'history', 'first-page'],
    queryFn: () => quizService.getHistory(1, 50),
  });
  const historyPage = historyQuery.data;

  const statsBySubject = useMemo<Record<number, SubjectQuizStats>>(() => {
    const items: QuizSessionHistoryItem[] = historyPage?.data ?? [];
    const acc: Record<number, { sessions: number; sumPct: number }> = {};
    for (const item of items) {
      const key = item.subject.id;
      if (!acc[key]) acc[key] = { sessions: 0, sumPct: 0 };
      acc[key].sessions += 1;
      acc[key].sumPct += item.percentage;
    }
    const result: Record<number, SubjectQuizStats> = {};
    for (const [id, { sessions, sumPct }] of Object.entries(acc)) {
      result[Number(id)] = {
        sessions,
        averagePct: sessions > 0 ? Math.round(sumPct / sessions) : null,
      };
    }
    return result;
  }, [historyPage]);

  const { guard } = usePremiumGate();

  const handlePickSubject = (subject: Subject) => {
    // Quiz est 100% Premium (RM-QUIZ-05). Gate systématique.
    // Le flow passe désormais par la sélection de chapitre avant de
    // démarrer la session (cf. maquette : matière → chapitre → questions).
    guard({ is_free: false, title: 'le quiz' }, () => {
      router.push({
        pathname: '/quiz-chapters',
        params: {
          subjectId: subject.id.toString(),
          subjectLabel: subject.name,
        },
      });
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={{ height: insets.top, backgroundColor: C.green }} />

      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>Quiz</Text>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={C.green} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={subjectsQuery.isRefetching || historyQuery.isRefetching}
              onRefresh={() => {
                subjectsQuery.refetch();
                historyQuery.refetch();
              }}
              tintColor={C.green}
            />
          }
        >
          <Text style={styles.headerTitle}>
            Teste-toi sur toutes{'\n'}les matières
          </Text>
          <Text style={styles.headerSubtitle}>
            10 questions par session · mode examen blanc.
          </Text>

          {subjects.length === 0 ? (
            <EmptyState
              illustration={IllustrationEmptyCourses}
              title="Aucune matière disponible"
              description="Les quiz arrivent bientôt pour ta série."
            />
          ) : (
            <View style={styles.grid}>
              {subjects.map((s) => {
                const stats = statsBySubject[s.id];
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={styles.card}
                    activeOpacity={0.7}
                    onPress={() => handlePickSubject(s)}
                  >
                    <SubjectIcon kind={backendSlugToSubjectKind(s.icon_slug)} size={52} />
                    <Text style={styles.cardTitle} numberOfLines={1}>{s.name}</Text>
                    <Text style={styles.cardCount}>
                      {stats && stats.sessions > 0
                        ? `${stats.sessions} session${stats.sessions > 1 ? 's' : ''} · ${stats.averagePct}% moyen`
                        : 'Commencer'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  appBar: {
    height: 64,
    backgroundColor: C.green,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  appBarTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 17,
    color: '#fff',
  },
  content: {
    padding: 20,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: C.ink,
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  headerSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13.5,
    color: C.ink2,
    marginTop: 6,
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    shadowColor: C.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 4,
  },
  cardTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: C.ink,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 2,
    width: '100%',
  },
  cardCount: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11.5,
    color: C.ink3,
    textAlign: 'center',
  },
});
