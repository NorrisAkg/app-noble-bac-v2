import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { WebView } from 'react-native-webview';

import { courseService } from '@/services/courseService';
import { upsertLastRead } from '@/services/meService';
import { usePremiumGate } from '@/hooks/usePremiumGate';
import { getApiErrorMessage } from '@/utils/apiError';
import { C } from '@/constants/theme';
import { queryKeys } from '@/lib/queryKeys';

export default function CourseReaderScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { lessonId, subject = 'Cours' } = useLocalSearchParams<{
    lessonId: string;
    subject?: string;
  }>();

  const { data: lesson, isLoading, error } = useQuery({
    queryKey: queryKeys.courses.lesson(lessonId),
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
  const [webViewLoaded, setWebViewLoaded] = useState(false);

  useEffect(() => {
    if (status === 'forbidden') {
      showPremium('cette leçon');
      if (router.canGoBack()) router.back();
    }
  }, [status, showPremium, router]);

  // ── Progress tracking for "Reprendre" ────────────────────────────────────
  const queryClient = useQueryClient();
  const maxProgressPctRef = useRef(0);
  const viewportHRef = useRef(0);
  const contentHRef = useRef(0);
  const lessonLoadedRef = useRef(false);

  useEffect(() => {
    if (status === 'ready' && lesson) {
      lessonLoadedRef.current = true;
    }
  }, [status, lesson]);

  useEffect(() => {
    return () => {
      if (!lessonLoadedRef.current || !lessonId) return;
      const fitsViewport =
        contentHRef.current > 0 && contentHRef.current <= viewportHRef.current;
      const progressPct = fitsViewport ? 100 : maxProgressPctRef.current;

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

  const hasHtml = status === 'ready' && !!lesson?.html_url;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={{ height: insets.top, backgroundColor: C.green }} />

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

      {/* ── HTML mode — leçon avec fichier R2 uploadé ──────────────────── */}
      {hasHtml && (
        <View style={{ flex: 1 }}>
          {!webViewLoaded && (
            <View style={[StyleSheet.absoluteFill, styles.centered]}>
              <ActivityIndicator size="large" color={C.green} />
              <Text style={styles.helperText}>Chargement de la leçon…</Text>
            </View>
          )}
          <WebView
            style={webViewLoaded ? styles.webView : styles.webViewHidden}
            source={{ uri: lesson!.html_url! }}
            onLoad={() => {
              setWebViewLoaded(true);
              // Mark lesson as fully read once the HTML loads.
              maxProgressPctRef.current = 100;
            }}
            javaScriptEnabled
            domStorageEnabled
            setSupportMultipleWindows={false}
          />
        </View>
      )}

      {/* ── Fallback scroll mode (no HTML file yet) ─────────────────────── */}
      {!hasHtml && (
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

          {status === 'error' && (
            <View style={styles.centered}>
              <Text style={styles.errorTitle}>Impossible de charger la leçon</Text>
              <Text style={styles.errorText}>{getApiErrorMessage(error)}</Text>
              <TouchableOpacity onPress={() => router.back()} style={styles.backToListBtn}>
                <Text style={styles.backToListText}>Retour</Text>
              </TouchableOpacity>
            </View>
          )}

          {status === 'ready' && !lesson?.html_url && (
            <View style={styles.centered}>
              <Text style={styles.errorTitle}>Contenu non disponible</Text>
              <Text style={styles.errorText}>
                Le contenu de cette leçon n&apos;est pas encore disponible.
              </Text>
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
    backgroundColor: '#fff',
  },
  header: {
    height: 64,
    backgroundColor: C.green,
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
  webView: { flex: 1 },
  webViewHidden: { flex: 0, height: 0 },
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
    backgroundColor: C.green,
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
