import React from 'react';
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
import { C } from '@/constants/theme';
import type { Chapter } from '@/types/api';

const QUIZ_MIN_QUESTIONS = 3;

/**
 * Écran de sélection de chapitre pour démarrer un quiz.
 *
 * Reçu via /quiz → tap sur une matière. Affiche la liste des chapitres
 * publiés de la matière avec un compteur de questions disponibles.
 * Un chapitre avec moins de 3 questions est désactivé (la maquette
 * attend qu'on guide l'utilisateur vers les chapitres prêts).
 */
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
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Aucun chapitre publié pour cette matière.</Text>
            </View>
          )}

          {chapters.map((chapter) => {
            const count = chapter.quiz_questions_count ?? 0;
            const isQuizable = count >= QUIZ_MIN_QUESTIONS;

            return (
              <TouchableOpacity
                key={chapter.id}
                onPress={() => (isQuizable ? handlePickChapter(chapter) : null)}
                disabled={!isQuizable}
                activeOpacity={0.7}
                style={[styles.card, !isQuizable && styles.cardDisabled]}
              >
                <View style={styles.cardOrder}>
                  <Text style={styles.cardOrderText}>{chapter.order}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle} numberOfLines={2}>{chapter.title}</Text>
                  <Text style={styles.cardMeta}>
                    {isQuizable
                      ? `${count} question${count > 1 ? 's' : ''} · Quiz disponible`
                      : 'Bientôt disponible'}
                  </Text>
                </View>
                {isQuizable ? (
                  <ChevronRight size={20} color={C.green} strokeWidth={2.4} />
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
  cardOrder: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EAF7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardOrderText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: C.green,
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
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: C.ink3,
    textAlign: 'center',
  },
});
