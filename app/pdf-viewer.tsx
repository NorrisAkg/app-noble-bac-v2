import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import { ChevronLeft, Check, Download } from 'lucide-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { catalogService } from '@/services/catalogService';
import { courseService } from '@/services/courseService';
import { declareDownload, listDownloads } from '@/services/myDownloadsService';
import { getApiErrorMessage } from '@/utils/apiError';
import type { OfflineDownloadableType, QuotaExceededErrorPayload } from '@/types/api';

const DOWNLOADS_QUERY_KEY = ['my-downloads'] as const;

export default function PdfViewerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { url: initialUrl, title, subject, bookId, revisionSheetId } = useLocalSearchParams<{
    url?: string;
    title?: string;
    subject?: string;
    bookId?: string;
    revisionSheetId?: string;
  }>();

  const [pdfUrl, setPdfUrl] = useState<string | null>(initialUrl || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Identification polymorphe pour le bouton "Telecharger hors-ligne".
  // Les corriges (signed-url depuis Library) n'ont pas encore d'ID expose
  // cote mobile : bouton masque dans ce cas (MVP — cf PLAN M-P5.3).
  const downloadable: { type: OfflineDownloadableType; id: number } | null = bookId
    ? { type: 'book', id: Number(bookId) }
    : revisionSheetId
      ? { type: 'revision_sheet', id: Number(revisionSheetId) }
      : null;

  // Verifie si ce downloadable est deja dans "Mes telechargements" pour
  // afficher l'etat "Telecharge" au lieu du bouton Telecharger.
  const { data: downloadsData } = useQuery({
    queryKey: DOWNLOADS_QUERY_KEY,
    queryFn: listDownloads,
    staleTime: 30 * 1000,
    enabled: downloadable !== null,
  });

  const alreadyDownloaded =
    downloadable !== null &&
    (downloadsData?.downloads ?? []).some(
      (d) => d.downloadable_type === downloadable.type && d.downloadable_id === downloadable.id,
    );

  useEffect(() => {
    if (initialUrl) {
      setLoading(false);
      return;
    }
    if (bookId) {
      loadFromBook(Number(bookId));
      return;
    }
    if (revisionSheetId) {
      loadFromRevisionSheet(Number(revisionSheetId));
      return;
    }
    setLoading(false);
  }, [bookId, revisionSheetId, initialUrl]);

  const loadFromBook = async (id: number) => {
    try {
      setLoading(true);
      const { url } = await catalogService.downloadBook(id);
      setPdfUrl(url);
    } catch (err: any) {
      handleLoadError(err, 'Cet ouvrage est réservé aux abonnés Premium.');
    } finally {
      setLoading(false);
    }
  };

  const loadFromRevisionSheet = async (id: number) => {
    try {
      setLoading(true);
      const sheet = await courseService.getRevisionSheet(id);
      if (!sheet.signed_url) {
        setError("Cette fiche n'est pas encore prête au téléchargement.");
        return;
      }
      setPdfUrl(sheet.signed_url);
    } catch (err: any) {
      handleLoadError(err, 'Cette fiche est réservée aux abonnés Premium.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadError = (err: any, premiumMessage: string) => {
    console.error('Failed to load PDF URL:', err);
    setError(err?.response?.status === 403 ? premiumMessage : 'Impossible de charger le document.');
  };

  // ─── Telechargement hors-ligne ────────────────────────────────────────────

  const downloadMutation = useMutation({
    mutationFn: () => {
      if (downloadable === null) {
        return Promise.reject(new Error('downloadable_inconnu'));
      }
      return declareDownload({
        downloadable_type: downloadable.type,
        downloadable_id: downloadable.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DOWNLOADS_QUERY_KEY });
      Alert.alert(
        'Téléchargement enregistré',
        'Tu retrouves ce document dans "Mes téléchargements" (Profil → Mes téléchargements).',
      );
    },
    onError: (err: any) => {
      // 422 quota dépassé : payload `errors.suggestion` selon contrat backend
      // QuotaExceededException -> ApiResponse 422 avec errors: { suggestion: {...} }.
      const suggestion = err?.response?.data?.errors?.suggestion as QuotaExceededErrorPayload | undefined;
      if (suggestion) {
        const toFreeMo = Math.ceil(suggestion.kb_to_free / 1024);
        Alert.alert(
          'Quota offline dépassé',
          `Tu dois libérer ~${toFreeMo} Mo. Ouvre "Mes téléchargements" pour supprimer d'anciens fichiers.`,
          [
            { text: 'Annuler', style: 'cancel' },
            // typedRoutes Expo Router : la route `/my-downloads` est generee au prochain build.
            { text: 'Voir mes téléchargements', onPress: () => router.push('/my-downloads') },
          ],
        );
        return;
      }
      Alert.alert('Téléchargement impossible', getApiErrorMessage(err));
    },
  });

  // ─── Rendus erreurs / chargement ──────────────────────────────────────────

  if (error) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 40 }]}>
        <Text style={{ color: '#fff', textAlign: 'center', fontFamily: 'Poppins_500Medium' }}>{error}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtnAction}>
          <Text style={{ color: '#fff', fontFamily: 'Poppins_600SemiBold' }}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading && !pdfUrl) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3DBE45" />
      </View>
    );
  }

  if (!pdfUrl) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#fff' }}>URL du document introuvable.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: '#3DBE45' }}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const sourceUri =
    Platform.OS === 'android'
      ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfUrl)}`
      : pdfUrl;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Top spacer for status bar */}
      <View style={{ height: insets.top, backgroundColor: '#1A2027' }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#fff" strokeWidth={2.4} />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title || 'Document PDF'}
          </Text>
          {subject && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subject}
            </Text>
          )}
        </View>

        {downloadable !== null && (
          <TouchableOpacity
            onPress={() => downloadMutation.mutate()}
            disabled={downloadMutation.isPending || alreadyDownloaded}
            style={[styles.downloadBtn, alreadyDownloaded && styles.downloadBtnDone]}
            accessibilityLabel={alreadyDownloaded ? 'Document déjà téléchargé' : 'Télécharger hors-ligne'}
          >
            {downloadMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : alreadyDownloaded ? (
              <Check size={18} color="#fff" strokeWidth={2.4} />
            ) : (
              <Download size={18} color="#fff" strokeWidth={2.4} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#3DBE45" />
            <Text style={styles.loaderText}>Chargement du document...</Text>
          </View>
        )}

        <WebView
          source={{ uri: sourceUri }}
          style={styles.webview}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          scalesPageToFit={true}
          bounces={false}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      {/* Bottom spacer for home indicator */}
      <View style={{ height: insets.bottom, backgroundColor: '#F5F5F5' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D3138',
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
  downloadBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3DBE45',
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadBtnDone: {
    backgroundColor: '#2A9B33',
    opacity: 0.7,
  },
  content: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  loaderText: {
    marginTop: 12,
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: '#5A6470',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backBtnAction: {
    marginTop: 20,
    backgroundColor: '#3DBE45',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
});
