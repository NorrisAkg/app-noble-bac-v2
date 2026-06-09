import React, { useEffect, useState } from 'react';
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

function buildEmbedUri(provider: string, videoId: string): string {
  const id = encodeURIComponent(videoId);
  if (provider === 'vimeo') {
    return `https://player.vimeo.com/video/${id}?autoplay=1`;
  }
  return `https://www.youtube.com/watch?v=${id}`;
}

export default function ChapterVideoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { videoId, title, subject } = useLocalSearchParams<{
    videoId: string;
    title?: string;
    subject?: string;
  }>();

  const [webviewLoading, setWebviewLoading] = useState(true);
  const [webviewError, setWebviewError] = useState(false);

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

  const embedUri = video ? buildEmbedUri(video.video_provider, video.video_id) : null;

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

        {!isLoading && video && !error && webviewError && (
          <View style={styles.centered}>
            <Text style={styles.errorTitle}>Vidéo indisponible</Text>
            <Text style={styles.errorText}>Impossible de charger cette vidéo.</Text>
          </View>
        )}

        {!isLoading && embedUri && !error && !webviewError && (
          <View style={styles.webviewContainer}>
            <WebView
              originWhitelist={['*']}
              source={{ uri: embedUri }}
              style={styles.webview}
              allowsFullscreenVideo
              javaScriptEnabled
              mediaPlaybackRequiresUserAction={false}
              onLoadStart={() => setWebviewLoading(true)}
              onLoadEnd={() => setWebviewLoading(false)}
              onError={() => { setWebviewLoading(false); setWebviewError(true); }}
              onHttpError={(e) => {
                if (e.nativeEvent.statusCode >= 400) { setWebviewLoading(false); setWebviewError(true); }
              }}
            />
            {webviewLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#3DBE45" />
              </View>
            )}
          </View>
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
  webviewContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
