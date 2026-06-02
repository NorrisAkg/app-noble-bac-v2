import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react-native';

import { courseService } from '@/services/courseService';
import { quizService } from '@/services/quizService';
import { SubjectIcon, backendSlugToSubjectKind } from '@/components/ui/SubjectIcon';
import { EmptyState } from '@/components/ui/EmptyState';
import { IllustrationEmptyCourses } from '@/components/ui/EmptyIllustrations';
import { C } from '@/constants/theme';
import type { Chapter } from '@/types/api';

const QUIZ_MIN_QUESTIONS = 3;

export default function QuizChaptersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { subjectId, subjectLabel = 'Quiz' } = useLocalSearchParams<{
    subjectId: string;
    subjectLabel?: string;
  }>();

  const chaptersQuery = useQuery({
    queryKey: ['courses', 'chapters', Number(subjectId)],
    queryFn: () => courseService.getChapters(Number(subjectId)),
    enabled: !!subjectId,
  });

  const historyQuery = useQuery({
    queryKey: ['quiz', 'history', 'subject', Number(subjectId)],
    queryFn: () => quizService.getHistory(1, 100, Number(subjectId)),
    enabled: !!subjectId,
  });

  const bestScores = useMemo(() => {
    const map: Record<number, { score: number; total: number }> = {};
    for (const s of historyQuery.data?.data ?? []) {
      if (!s.chapter?.id) continue;
      const prev = map[s.chapter.id];
      if (!prev || s.score > prev.score) {
        map[s.chapter.id] = { score: s.score, total: s.total_questions };
      }
    }
    return map;
  }, [historyQuery.data]);

  const chapters: Chapter[] = chaptersQuery.data ?? [];

  const handlePickChapter = (chapter: Chapter) => {
    router.push({
      pathname: '/quiz-session',
      params: {
        chapterId: String(chapter.id),
        subjectLabel,
        chapterTitle: chapter.title,
      },
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={{ height: insets.top, backgroundColor: C.green }} />

      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ChevronLeft color="#fff" size={24} />
        </TouchableOpacity>
        <View style={styles.appBarTitleContainer}>
          <Text style={styles.appBarSubtitle}>Quiz</Text>
          <Text style={styles.appBarTitle} numberOfLines={1}>{subjectLabel}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {chaptersQuery.isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={C.green} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.headerTitle}>Choisis un chapitre</Text>
          <Text style={styles.headerSubtitle}>
            Le quiz utilise toutes les questions disponibles pour le chapitre.
          </Text>

          {chapters.length === 0 && (
            <EmptyState
              illustration={IllustrationEmptyCourses}
              title="Aucun chapitre publié"
              description="Aucun chapitre n'est encore disponible pour cette matière."
            />
          )}

          {chapters.map((chapter) => {
            const count = chapter.quiz_questions_count ?? 0;
            const isQuizable = count >= QUIZ_MIN_QUESTIONS;
            const best = bestScores[chapter.id];
            const hasHistory = !!best;

            return (
              <TouchableOpacity
                key={chapter.id}
                onPress={() => (isQuizable ? handlePickChapter(chapter) : null)}
                disabled={!isQuizable}
                activeOpacity={0.7}
                style={[styles.card, !isQuizable && styles.cardDisabled]}
              >
                <SubjectIcon
                  kind={backendSlugToSubjectKind(chapter.icon_slug)}
                  size={56}
                  style={{ borderRadius: 999 }}
                />

                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle} numberOfLines={2}>{chapter.title}</Text>
                  <Text style={[styles.cardMeta, isQuizable && hasHistory && styles.cardMetaGreen]}>
                    {isQuizable
                      ? (hasHistory ? 'En cours' : 'Commencez le Quiz')
                      : 'Bientôt disponible'}
                  </Text>
                </View>

                {isQuizable ? (
                  <View style={styles.rightSlot}>
                    {hasHistory && (
                      <Text style={styles.score}>{best.score}/{best.total}</Text>
                    )}
                    <ChevronRight size={20} color={C.green} strokeWidth={2.4} />
                  </View>
                ) : (
                  <Lock size={16} color="#9AA3AC" />
                )}
              </TouchableOpacity>
            );
          })}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appBarTitleContainer: {
    flex: 1,
    marginHorizontal: 8,
  },
  appBarSubtitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  appBarTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: '#fff',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  headerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: C.ink,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13.5,
    color: C.ink2,
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 19,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
    shadowColor: C.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardDisabled: {
    opacity: 0.55,
  },
  cardTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: C.ink,
    lineHeight: 18,
  },
  cardMeta: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: C.ink3,
    marginTop: 4,
  },
  cardMetaGreen: {
    color: C.green,
  },
  rightSlot: {
    alignItems: 'flex-end',
    gap: 2,
  },
  score: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
    color: C.danger,
  },
});
