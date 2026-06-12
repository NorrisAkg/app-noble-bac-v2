import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { TexRenderer } from '@/components/courses/TexRenderer';
import { courseService } from '@/services/courseService';
import { upsertLastRead } from '@/services/meService';
import { usePremiumGate } from '@/hooks/usePremiumGate';
import { getApiErrorMessage } from '@/utils/apiError';
import { C } from '@/constants/theme';

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

  const { show: showPremium } = usePremiumGate();

  // Filet 403 : si la leçon refuse l'accès (Premium requis), on bascule
  // sur le PremiumLockSheet global et on referme le reader.
  useEffect(() => {
    if (status === 'forbidden') {
      showPremium('cette leçon');
      if (router.canGoBack()) router.back();
    }
  }, [status, showPremium, router]);

  // ── Déclaration « Reprendre » ────────────────────────────────────────────
  // Mesure du scroll pour PATCH /me/last-read à la fermeture du reader.
  // Refs (et non states) : lues dans le cleanup sans re-render.
  const queryClient = useQueryClient();
  const maxProgressPctRef = useRef(0);
  const viewportHRef = useRef(0);
  const contentHRef = useRef(0);
  const lessonLoadedRef = useRef(false);

  useEffect(() => {
    if (status === 'ready' && lesson?.content) {
      lessonLoadedRef.current = true;
    }
  }, [status, lesson?.content]);

  useEffect(() => {
    return () => {
      if (!lessonLoadedRef.current || !lessonId) return;
      // Leçon entièrement visible sans scroll → lue à 100 %.
      const fitsViewport =
        contentHRef.current > 0 && contentHRef.current <= viewportHRef.current;
      const progressPct = fitsViewport ? 100 : maxProgressPctRef.current;

      // Fire-and-forget : la déclaration ne doit jamais gêner la navigation.
      upsertLastRead({
        readable_type: 'lesson',
        readable_id: Number(lessonId),
        progress_pct: progressPct,
      })
        .then(() =>
          queryClient.invalidateQueries({ queryKey: ['me', 'last-read'] }),
        )
        .catch(() => {});
    };
  }, [lessonId, queryClient]);

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

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
        onLayout={(e) => {
          viewportHRef.current = e.nativeEvent.layout.height;
        }}
        onContentSizeChange={(_w, h) => {
          contentHRef.current = h;
        }}
        scrollEventThrottle={100}
        onScroll={(e) => {
          const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
          if (contentSize.height <= 0) return;
          const pct = Math.min(
            100,
            Math.max(
              0,
              Math.round(
                ((contentOffset.y + layoutMeasurement.height) / contentSize.height) * 100,
              ),
            ),
          );
          if (pct > maxProgressPctRef.current) maxProgressPctRef.current = pct;
        }}
      >
        {status === 'loading' && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={C.green} />
            <Text style={styles.helperText}>Chargement de la leçon…</Text>
          </View>
        )}

        {/* status === 'forbidden' géré via useEffect ci-dessus : showPremium + router.back */}

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
      </ScrollView>
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
});
