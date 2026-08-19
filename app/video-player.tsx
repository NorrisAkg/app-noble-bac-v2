import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  ScrollView,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, PlayCircle, AlertCircle, ExternalLink } from 'lucide-react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { WebView } from 'react-native-webview';
import { useQuery } from '@tanstack/react-query';

import { courseService } from '@/services/courseService';
import { usePremiumGate } from '@/hooks/usePremiumGate';
import { getApiErrorMessage } from '@/utils/apiError';
import { queryKeys } from '@/lib/queryKeys';
import { buildEmbedUri, isPlayerExitUrl } from '@/utils/videoEmbed';
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';

export default function VideoPlayerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const {
    youtubeId,
    chapterVideoId,
    videoId,
    title: paramTitle,
    subject: paramSubject,
    provider: paramProvider,
    description: paramDescription,
  } = useLocalSearchParams<{
    youtubeId?: string;
    chapterVideoId?: string;
    videoId?: string;
    title?: string;
    subject?: string;
    provider?: string;
    description?: string;
  }>();

  const targetChapterVideoId = chapterVideoId ?? (!youtubeId && videoId ? videoId : undefined);

  // Si un chapterVideoId est fourni, on interroge l'API pour récupérer les détails
  const {
    data: chapterVideo,
    isLoading: isLoadingChapter,
    error: chapterError,
  } = useQuery({
    queryKey: queryKeys.courses.chapterVideo(targetChapterVideoId),
    queryFn: () => courseService.getChapterVideo(Number(targetChapterVideoId)),
    enabled: !!targetChapterVideoId && !youtubeId,
  });

  const isForbidden = (chapterError as any)?.response?.status === 403;
  const { show: showPremium } = usePremiumGate();

  // Filet 403 : bascule vers le sheet Premium si non autorisé
  useEffect(() => {
    if (isForbidden) {
      showPremium('cette vidéo');
      if (router.canGoBack()) router.back();
    }
  }, [isForbidden, showPremium, router]);

  const rawVideoId = youtubeId ?? chapterVideo?.video_id ?? '';
  const provider = (paramProvider ?? chapterVideo?.video_provider ?? 'youtube').toLowerCase();
  const videoTitle = paramTitle ?? chapterVideo?.title ?? 'Vidéo explicative';
  const subjectName = paramSubject ?? '';
  const videoDescription = paramDescription ?? chapterVideo?.description ?? null;

  const [playing, setPlaying] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);

  const onStateChange = useCallback((state: string) => {
    if (state === 'ended') {
      setPlaying(false);
    }
  }, []);

  const onError = useCallback((error: string) => {
    setPlayerError(error);
  }, []);

  const playerHeight = Math.round((width * 9) / 16);

  const isLoading = !youtubeId && isLoadingChapter;

  const handleOpenExternal = async () => {
    if (rawVideoId.length === 0) return;
    const url =
      provider === 'vimeo'
        ? `https://vimeo.com/${rawVideoId}`
        : `https://www.youtube.com/watch?v=${rawVideoId}`;
    try {
      await Linking.openURL(url);
    } catch {
      // Ignorer si l'ouverture échoue
    }
  };

  const isEmbedDisabledError =
    playerError === 'embed_not_allowed' ||
    playerError === '150' ||
    playerError === '101' ||
    playerError?.toLowerCase().includes('embed');

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={{ height: insets.top, backgroundColor: '#1A2027' }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          style={styles.backBtn}
          activeOpacity={0.7}
          accessibilityLabel="Retour"
        >
          <ArrowLeft size={22} color="#fff" strokeWidth={2.4} />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {videoTitle}
          </Text>
          {subjectName.length > 0 && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subjectName}
            </Text>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ flexGrow: 1 }}
        bounces={false}
      >
        {/* Zone Lecteur Vidéo */}
        <View style={[styles.playerContainer, { height: playerHeight }]}>
          {isLoading && (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#3DBE45" />
            </View>
          )}

          {!isLoading && !isForbidden && chapterError && (
            <View style={styles.centered}>
              <AlertCircle size={32} color="#E23F3F" />
              <Text style={styles.errorTitle}>Impossible de charger la vidéo</Text>
              <Text style={styles.errorText}>{getApiErrorMessage(chapterError)}</Text>
            </View>
          )}

          {!isLoading && playerError && (
            <View style={styles.centered}>
              <AlertCircle size={32} color="#FFA114" />
              <Text style={styles.errorTitle}>
                {isEmbedDisabledError
                  ? 'Intégration restreinte par l’auteur'
                  : 'Vidéo indisponible dans le lecteur'}
              </Text>
              <Text style={styles.errorText}>
                {isEmbedDisabledError
                  ? 'L’auteur de cette vidéo n’autorise pas la lecture sur les autres applications.'
                  : `Une erreur est survenue lors du chargement (${playerError}).`}
              </Text>
              <TouchableOpacity
                onPress={handleOpenExternal}
                style={styles.fallbackBtn}
                activeOpacity={0.8}
              >
                <ExternalLink size={16} color="#fff" strokeWidth={2.2} />
                <Text style={styles.fallbackBtnText}>Ouvrir sur YouTube</Text>
              </TouchableOpacity>
            </View>
          )}

          {!isLoading && !chapterError && !playerError && rawVideoId.length > 0 && (
            <>
              {provider === 'youtube' ? (
                <View style={{ width, height: playerHeight }}>
                  <YoutubePlayer
                    height={playerHeight}
                    width={width}
                    play={playing}
                    videoId={rawVideoId}
                    onChangeState={onStateChange}
                    onReady={() => setIsReady(true)}
                    onError={onError}
                    initialPlayerParams={{
                      preventFullScreen: false,
                      rel: false,
                      modestbranding: true,
                      iv_load_policy: 3,
                      controls: true,
                    }}
                    webViewProps={{
                      allowsFullscreenVideo: true,
                      androidLayerType: 'hardware',
                      originWhitelist: ['*'],
                      baseUrl: 'https://www.youtube.com',
                    }}
                  />
                  {!isReady && (
                    <View style={styles.loadingOverlay}>
                      <ActivityIndicator size="large" color="#3DBE45" />
                    </View>
                  )}
                </View>
              ) : (
                /* Fallback Vimeo ou autre provider via WebView sécurisée */
                <WebView
                  originWhitelist={['*']}
                  source={{ uri: buildEmbedUri(provider, rawVideoId) }}
                  style={styles.webview}
                  allowsFullscreenVideo
                  javaScriptEnabled
                  mediaPlaybackRequiresUserAction={false}
                  onShouldStartLoadWithRequest={(req: ShouldStartLoadRequest) =>
                    !isPlayerExitUrl(req.url)
                  }
                  setSupportMultipleWindows={false}
                />
              )}
            </>
          )}
        </View>

        {/* Détails et métadonnées */}
        <View style={styles.infoSection}>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <PlayCircle size={14} color="#3DBE45" strokeWidth={2.4} />
              <Text style={styles.badgeText}>Vidéo explicative</Text>
            </View>
            {subjectName.length > 0 && (
              <View style={styles.subjectBadge}>
                <Text style={styles.subjectBadgeText}>{subjectName}</Text>
              </View>
            )}
          </View>

          <Text style={styles.infoTitle}>{videoTitle}</Text>
          <Text style={videoDescription ? styles.infoDescription : styles.infoDescriptionEmpty}>
            {videoDescription ?? 'Aucune description pour cette vidéo.'}
          </Text>
        </View>
      </ScrollView>

      <View style={{ height: insets.bottom, backgroundColor: '#1A2027' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#12161A',
  },
  header: {
    backgroundColor: '#1A2027',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.08)',
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
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  content: {
    flex: 1,
  },
  playerContainer: {
    width: '100%',
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  errorTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
  },
  errorText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  fallbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E23F3F',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  fallbackBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: '#fff',
  },
  infoSection: {
    padding: 20,
    gap: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(61, 190, 69, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11.5,
    color: '#3DBE45',
  },
  subjectBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  subjectBadgeText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.8)',
  },
  infoTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#fff',
    lineHeight: 22,
  },
  infoDescription: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.65)',
    lineHeight: 19,
  },
  infoDescriptionEmpty: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
    lineHeight: 19,
    fontStyle: 'italic',
  },
});
