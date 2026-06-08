import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import { ChevronLeft } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';

import { courseService } from '@/services/courseService';
import { usePremiumGate } from '@/hooks/usePremiumGate';
import { getApiErrorMessage } from '@/utils/apiError';

export default function ChapterVideoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { videoId, title, subject } = useLocalSearchParams<{
    videoId: string;
    title?: string;
    subject?: string;
  }>();

  const { data: video, isLoading, error } = useQuery({
    queryKey: ['courses', 'chapter-video', videoId],
    queryFn: () => courseService.getChapterVideo(Number(videoId)),
    enabled: !!videoId,
  });

  const isForbidden = (error as any)?.response?.status === 403;

  const { show: showPremium } = usePremiumGate();

  // Filet 403 : bascule sur le PremiumLockSheet global et ferme le viewer.
  useEffect(() => {
    if (isForbidden) {
      showPremium('cette vidéo');
      if (router.canGoBack()) router.back();
    }
  }, [isForbidden, showPremium, router]);

  const embedSrc = video
    ? video.video_provider === 'vimeo'
      ? `https://player.vimeo.com/video/${encodeURIComponent(video.video_id)}?autoplay=1`
      : `https://www.youtube.com/embed/${encodeURIComponent(video.video_id)}?rel=0&playsinline=1`
    : '';

  const embedHtml = embedSrc
    ? `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;background:#000;height:100%}iframe{width:100%;height:100%;border:0}</style></head><body><iframe src="${embedSrc}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></body></html>`
    : '';

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={{ height: insets.top, backgroundColor: '#1A2027' }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#fff" strokeWidth={2.4} />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>{title ?? video?.title ?? 'Vidéo'}</Text>
          {subject && <Text style={styles.subtitle} numberOfLines={1}>{subject}</Text>}
        </View>
      </View>

      <View style={styles.content}>
        {isLoading && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#3DBE45" />
          </View>
        )}

        {/* isForbidden géré via useEffect ci-dessus : showPremium + router.back */}

        {!isLoading && !isForbidden && error && (
          <View style={styles.centered}>
            <Text style={styles.errorTitle}>Impossible de charger la vidéo</Text>
            <Text style={styles.errorText}>{getApiErrorMessage(error)}</Text>
          </View>
        )}

        {!isLoading && video && !error && (
          <WebView
            originWhitelist={['*']}
            source={{ html: embedHtml }}
            style={styles.webview}
            allowsFullscreenVideo
            javaScriptEnabled
            mediaPlaybackRequiresUserAction={false}
          />
        )}
      </View>

      <View style={{ height: insets.bottom, backgroundColor: '#000' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    backgroundColor: '#1A2027',
    paddingHorizontal: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: '#fff',
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.6)',
  },
  content: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 10,
  },
  errorTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  errorText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 19,
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
});
