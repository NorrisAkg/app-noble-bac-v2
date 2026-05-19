import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Share2, Bookmark, Lock } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';

import { TexRenderer } from '@/components/courses/TexRenderer';
import { courseService } from '@/services/courseService';
import { getApiErrorMessage } from '@/utils/apiError';

export default function CourseReaderScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { lessonId, subject = 'Cours' } = useLocalSearchParams<{
    lessonId: string;
    subject?: string;
  }>();

  const { data: lesson, isLoading, error } = useQuery({
    queryKey: ['courses', 'lesson', lessonId],
    queryFn: () => courseService.getLesson(Number(lessonId)),
    enabled: !!lessonId,
  });

  const status: 'loading' | 'error' | 'forbidden' | 'ready' = !lessonId
    ? 'error'
    : isLoading
    ? 'loading'
    : error
    ? ((error as any)?.response?.status === 403 ? 'forbidden' : 'error')
    : 'ready';

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={{ height: insets.top, backgroundColor: '#3DBE45' }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ChevronLeft color="#fff" size={24} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.subjectText}>{subject}</Text>
          <Text style={styles.titleText} numberOfLines={1}>
            {lesson?.title ?? 'Leçon'}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionBtn}>
            <Bookmark color="#fff" size={20} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Share2 color="#fff" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {status === 'loading' && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#3DBE45" />
            <Text style={styles.helperText}>Chargement de la leçon…</Text>
          </View>
        )}

        {status === 'forbidden' && (
          <View style={styles.centered}>
            <Lock size={36} color="#9AA3AC" />
            <Text style={styles.errorTitle}>Contenu Premium</Text>
            <Text style={styles.errorText}>
              Cette leçon est réservée aux abonnés Premium. Active ton abonnement pour y accéder.
            </Text>
          </View>
        )}

        {status === 'error' && (
          <View style={styles.centered}>
            <Text style={styles.errorTitle}>Impossible de charger la leçon</Text>
            <Text style={styles.errorText}>{getApiErrorMessage(error)}</Text>
            <TouchableOpacity onPress={() => router.back()} style={styles.backToListBtn}>
              <Text style={styles.backToListText}>Retour</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === 'ready' && lesson?.content && <TexRenderer content={lesson.content} />}

        {status === 'ready' && !lesson?.content && (
          <View style={styles.centered}>
            <Text style={styles.errorTitle}>Leçon sans contenu</Text>
            <Text style={styles.errorText}>Le contenu de cette leçon n&apos;est pas encore disponible.</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.quizFab, { bottom: insets.bottom + 20 }]}
        activeOpacity={0.9}
        onPress={() => router.push('/(tabs)/quiz')}
      >
        <Text style={styles.quizFabText}>🎯 Faire le Quiz</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 64,
    backgroundColor: '#3DBE45',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginHorizontal: 8,
  },
  subjectText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  titleText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: '#fff',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  helperText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: '#5A6470',
  },
  errorTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: '#1A2027',
    textAlign: 'center',
    marginTop: 8,
  },
  errorText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: '#5A6470',
    textAlign: 'center',
    lineHeight: 19,
  },
  backToListBtn: {
    marginTop: 12,
    backgroundColor: '#3DBE45',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  backToListText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#fff',
  },
  quizFab: {
    position: 'absolute',
    right: 20,
    backgroundColor: '#1A2027',
    paddingHorizontal: 20,
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  quizFabText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: '#fff',
  },
});
