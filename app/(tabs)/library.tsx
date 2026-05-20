import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ChevronDown, Download, Eye, Play } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';

import { CustomBottomSheet } from '@/components/ui/BottomSheet';
import { DiamondIcon } from '@/components/ui/DiamondIcon';
import { SubjectIcon, backendSlugToSubjectKind } from '@/components/ui/SubjectIcon';
import { usePremiumGate } from '@/hooks/usePremiumGate';
import { courseService } from '@/services/courseService';
import { catalogService } from '@/services/catalogService';
import { getProfile } from '@/services/profileService';
import { getApiErrorMessage } from '@/utils/apiError';
import type { ExamListItem, ExamVideoItem, Subject, UserProfile } from '@/types/api';

const TABS = [
  { id: 'epreuve', label: 'Épreuve' },
  { id: 'corrige', label: 'Corrigé' },
  { id: 'video', label: 'Vidéo' },
] as const;

type TabKind = (typeof TABS)[number]['id'];

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [tab, setTab] = useState<TabKind>('epreuve');
  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [year, setYear] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const profileQuery = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: getProfile,
    staleTime: 5 * 60 * 1000,
  });
  const profile = profileQuery.data;

  const subjectsQuery = useQuery<Subject[]>({
    queryKey: ['subjects'],
    queryFn: courseService.getSubjects,
    staleTime: 24 * 60 * 60 * 1000,
  });
  const subjects = useMemo<Subject[]>(() => subjectsQuery.data ?? [], [subjectsQuery.data]);

  // Selection initiale : 1er sujet des qu'ils arrivent.
  useEffect(() => {
    if (subjects.length > 0 && subjectId == null) {
      setSubjectId(subjects[0].id);
    }
  }, [subjects, subjectId]);

  const currentSubject = useMemo(
    () => subjects.find((s) => s.id === subjectId) ?? null,
    [subjects, subjectId],
  );

  // Liste des exams filtres par sujet + scope (country/series du profile).
  const examsQuery = useQuery({
    queryKey: [
      'catalog',
      'exams',
      { subjectId, countryId: profile?.country.id, seriesId: profile?.series.id },
    ],
    queryFn: () =>
      catalogService.getExams({
        subject_id: subjectId ?? undefined,
        country_id: profile?.country.id,
        series_id: profile?.series.id,
        per_page: 100,
      }),
    enabled: subjectId != null,
  });

  const exams: ExamListItem[] = useMemo(() => examsQuery.data?.data ?? [], [examsQuery.data]);

  // Annees dispo : extraites des exams retournes, tri desc.
  const availableYears = useMemo(
    () => Array.from(new Set(exams.map((e) => e.year))).sort((a, b) => b - a),
    [exams],
  );

  // Auto-selection de la derniere annee dispo quand la liste change.
  useEffect(() => {
    if (availableYears.length > 0 && (year == null || !availableYears.includes(year))) {
      setYear(availableYears[0]);
    }
  }, [availableYears, year]);

  const examForYear = useMemo<ExamListItem | undefined>(
    () => exams.find((e) => e.year === year),
    [exams, year],
  );

  // ─── Actions PDF / videos ─────────────────────────────────────────────────

  const { guard, show: showPremium } = usePremiumGate();

  const openPdfMutation = useMutation({
    mutationFn: async ({ examId, kind }: { examId: number; kind: 'epreuve' | 'corrige' }) => {
      return kind === 'corrige'
        ? catalogService.getCorrigeSignedUrl(examId)
        : catalogService.getExamSignedUrl(examId);
    },
    onSuccess: (signed, { kind }) => {
      router.push({
        pathname: '/pdf-viewer',
        params: {
          url: signed.url,
          title: kind === 'corrige' ? `Corrigé ${year}` : `Épreuve ${year}`,
          subject: currentSubject?.name ?? '',
        },
      });
    },
    onError: (err) => {
      // Filet 403 : si le backend refuse (ex. corrige hors scope), on bascule
      // vers le PremiumLockSheet plutôt qu'un Alert opaque.
      const status =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { status?: number } }).response?.status
          : undefined;
      if (status === 403) {
        showPremium('ce corrigé');
        return;
      }
      Alert.alert('Impossible d’ouvrir le document', getApiErrorMessage(err));
    },
  });

  const openCorrige = (examId: number) => {
    // Le corrigé est toujours Premium (RM-ACC-02). On gate avant le fetch.
    guard({ is_free: false, title: 'ce corrigé' }, () => {
      openPdfMutation.mutate({ examId, kind: 'corrige' });
    });
  };

  const videosQuery = useQuery({
    queryKey: ['catalog', 'videos', examForYear?.id],
    queryFn: () =>
      examForYear ? catalogService.getExamVideos(examForYear.id) : Promise.resolve([]),
    enabled: examForYear != null && tab === 'video',
    staleTime: 5 * 60 * 1000,
  });

  const openYoutubeVideo = (video: ExamVideoItem) => {
    // Les vidéos d'épreuve suivent leur flag is_free. is_free=true → libre,
    // sinon Premium gated.
    guard(video, async () => {
      const url = `https://www.youtube.com/watch?v=${video.youtube_video_id}`;
      try {
        await Linking.openURL(url);
      } catch {
        Alert.alert('Vidéo indisponible', 'Impossible d’ouvrir YouTube.');
      }
    });
  };

  // ─── Rendu ────────────────────────────────────────────────────────────────

  const profileMeta = profile != null ? `${profile.country.name} · Bac ${profile.series.label}` : '';

  const isLoadingExams = examsQuery.isLoading;
  const noExamsForSubject = !isLoadingExams && exams.length === 0;
  const noExamForYear = !isLoadingExams && exams.length > 0 && examForYear == null;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={{ height: insets.top, backgroundColor: '#3DBE45' }} />

      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>Sujets BAC</Text>
      </View>

      <View style={{ flex: 1 }}>
        <View style={styles.headerSection}>
          {profileMeta.length > 0 && (
            <View style={styles.profileRow}>
              <Text style={styles.profileText}>{profileMeta}</Text>
            </View>
          )}

          {/* Subject selector button */}
          <TouchableOpacity
            style={styles.subjectSelector}
            activeOpacity={0.8}
            onPress={() => setPickerOpen(true)}
            disabled={subjects.length === 0}
          >
            <SubjectIcon
              kind={backendSlugToSubjectKind(currentSubject?.icon_slug)}
              size={40}
            />
            <View style={styles.subjectSelectorContent}>
              <Text style={styles.subjectLabel}>Matière</Text>
              <Text style={styles.subjectValue}>{currentSubject?.name ?? 'Chargement...'}</Text>
            </View>
            <ChevronDown size={20} color="#5A6470" />
          </TouchableOpacity>

          {/* Years Scroller */}
          {availableYears.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.yearsScroll}
              style={styles.yearsContainer}
            >
              {availableYears.map((y) => {
                const active = y === year;
                return (
                  <TouchableOpacity
                    key={y}
                    style={[styles.yearBtn, active && styles.yearBtnActive]}
                    onPress={() => setYear(y)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.yearText, active && styles.yearTextActive]}>{y}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.tabBtn, active && styles.tabBtnActive]}
                  onPress={() => setTab(t.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
                  <DiamondIcon size={14} gradientId={`dmd-lib-${t.id}`} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Content list */}
        <ScrollView
          contentContainerStyle={[styles.contentScroll, { paddingBottom: insets.bottom + 110 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={
                profileQuery.isRefetching ||
                subjectsQuery.isRefetching ||
                examsQuery.isRefetching
              }
              onRefresh={() => {
                profileQuery.refetch();
                subjectsQuery.refetch();
                if (subjectId != null) examsQuery.refetch();
              }}
              tintColor="#3DBE45"
            />
          }
        >
          {isLoadingExams && (
            <View style={styles.stateBox}>
              <ActivityIndicator color="#3DBE45" />
            </View>
          )}

          {noExamsForSubject && (
            <View style={styles.stateBox}>
              <Text style={styles.stateText}>
                Aucune annale publiée pour cette matière dans ton scope ({profileMeta}).
              </Text>
            </View>
          )}

          {noExamForYear && (
            <View style={styles.stateBox}>
              <Text style={styles.stateText}>Sélectionne une année.</Text>
            </View>
          )}

          {examForYear != null && tab === 'epreuve' && (
            <DocCard
              title={`${currentSubject?.name ?? ''} · BAC ${examForYear.year}`}
              meta={examForYear.session ? `Session ${examForYear.session}` : 'Annale officielle'}
              extra={`${examForYear.series.name} · ${examForYear.country.name}`}
              kind="pdf"
              loading={openPdfMutation.isPending}
              onOpen={() => openPdfMutation.mutate({ examId: examForYear.id, kind: 'epreuve' })}
            />
          )}

          {examForYear != null && tab === 'corrige' && (
            <DocCard
              title={`Corrigé · ${currentSubject?.name ?? ''} ${examForYear.year}`}
              meta="Premium requis"
              extra={`${examForYear.series.name} · ${examForYear.country.name}`}
              kind="pdf-green"
              loading={openPdfMutation.isPending}
              onOpen={() => openCorrige(examForYear.id)}
            />
          )}

          {examForYear != null && tab === 'video' && (
            <VideosSection
              isLoading={videosQuery.isLoading}
              videos={videosQuery.data ?? []}
              onOpen={openYoutubeVideo}
            />
          )}
        </ScrollView>
      </View>

      {/* Subject Picker Sheet */}
      <CustomBottomSheet
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Choisir une matière"
      >
        <View style={styles.sheetGrid}>
          {subjects.map((s) => {
            const active = s.id === subjectId;
            return (
              <TouchableOpacity
                key={s.id}
                style={[styles.sheetItem, active && styles.sheetItemActive]}
                onPress={() => {
                  setSubjectId(s.id);
                  setPickerOpen(false);
                }}
                activeOpacity={0.7}
              >
                <SubjectIcon kind={backendSlugToSubjectKind(s.icon_slug)} size={32} />
                <Text style={[styles.sheetItemLabel, active && styles.sheetItemLabelActive]}>
                  {s.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </CustomBottomSheet>
    </View>
  );
}

// ─── Components ─────────────────────────────────────────────────────────────

interface DocCardProps {
  title: string;
  meta: string;
  extra: string;
  kind: 'pdf' | 'pdf-green';
  loading: boolean;
  onOpen: () => void;
}

const DocCard: React.FC<DocCardProps> = ({ title, meta, extra, kind, loading, onOpen }) => {
  const isGreen = kind === 'pdf-green';
  return (
    <TouchableOpacity style={styles.docCard} activeOpacity={0.8} onPress={onOpen} disabled={loading}>
      <View style={[styles.docThumb, isGreen ? styles.docThumbGreen : styles.docThumbSalmon]}>
        <Text
          style={[
            styles.docThumbText,
            isGreen ? styles.docThumbTextGreen : styles.docThumbTextSalmon,
          ]}
        >
          PDF
        </Text>
        <View
          style={[
            styles.docThumbFold,
            isGreen ? styles.docThumbFoldGreen : styles.docThumbFoldSalmon,
          ]}
        />
      </View>
      <View style={styles.docInfo}>
        <Text style={styles.docTitle}>{title}</Text>
        <Text style={styles.docMeta}>{meta}</Text>
        <Text style={styles.docExtra}>{extra}</Text>

        <View style={styles.docActions}>
          <TouchableOpacity
            style={styles.docActionBtnPrimary}
            activeOpacity={0.8}
            onPress={onOpen}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Download size={14} color="#fff" strokeWidth={2.5} />
                <Text style={styles.docActionTextPrimary}>Télécharger</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.docActionBtnSecondary} activeOpacity={0.8} onPress={onOpen}>
            <Eye size={14} color="#5A6470" strokeWidth={2.5} />
            <Text style={styles.docActionTextSecondary}>Aperçu</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

interface VideosSectionProps {
  isLoading: boolean;
  videos: ExamVideoItem[];
  onOpen: (video: ExamVideoItem) => void;
}

const VideosSection: React.FC<VideosSectionProps> = ({ isLoading, videos, onOpen }) => {
  if (isLoading) {
    return (
      <View style={styles.stateBox}>
        <ActivityIndicator color="#3DBE45" />
      </View>
    );
  }
  if (videos.length === 0) {
    return (
      <View style={styles.stateBox}>
        <Text style={styles.stateText}>Aucune vidéo commentée pour cette épreuve.</Text>
      </View>
    );
  }
  return (
    <>
      {videos.map((v) => (
        <VideoCard
          key={v.id}
          title={v.title}
          duration={formatDuration(v.duration_sec)}
          onOpen={() => onOpen(v)}
        />
      ))}
    </>
  );
};

interface VideoCardProps {
  title: string;
  duration: string;
  onOpen: () => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ title, duration, onOpen }) => (
  <TouchableOpacity style={styles.videoCard} activeOpacity={0.8} onPress={onOpen}>
    <View style={styles.videoThumb}>
      <View style={styles.videoPlayBtn}>
        <Play size={20} color="#3DBE45" strokeWidth={2.5} style={{ marginLeft: 3 }} />
      </View>
      <View style={styles.videoDurationBadge}>
        <Text style={styles.videoDurationText}>{duration}</Text>
      </View>
    </View>
    <View style={styles.videoInfo}>
      <Text style={styles.videoTitle}>{title}</Text>
      <Text style={styles.videoSub}>Vidéo officielle Noble BAC</Text>
    </View>
  </TouchableOpacity>
);

function formatDuration(seconds: number | null): string {
  if (seconds == null || seconds <= 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  appBar: {
    height: 64,
    backgroundColor: '#3DBE45',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  appBarTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 17,
    color: '#fff',
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  profileText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: '#5A6470',
  },
  subjectSelector: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E6E8EB',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
    shadowColor: '#1A2027',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  subjectIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EAF7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectIconText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    color: '#3DBE45',
  },
  subjectSelectorContent: {
    flex: 1,
  },
  subjectLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 10.5,
    color: '#9AA3AC',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    lineHeight: 14,
  },
  subjectValue: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#1A2027',
    lineHeight: 18,
  },
  yearsContainer: {
    marginBottom: 12,
  },
  yearsScroll: {
    gap: 8,
    paddingBottom: 4,
  },
  yearBtn: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 19,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E6E8EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearBtnActive: {
    backgroundColor: '#3DBE45',
    borderColor: '#3DBE45',
    shadowColor: '#3DBE45',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 4,
  },
  yearText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: '#1A2027',
  },
  yearTextActive: {
    color: '#fff',
  },
  tabsContainer: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 4,
    flexDirection: 'row',
    shadowColor: '#1A2027',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  tabBtn: {
    flex: 1,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  tabBtnActive: {
    backgroundColor: '#E8A090',
  },
  tabText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: '#5A6470',
  },
  tabTextActive: {
    color: '#fff',
  },
  contentScroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  stateBox: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: '#5A6470',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  docCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    gap: 14,
    marginBottom: 12,
    shadowColor: '#1A2027',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  docThumb: {
    width: 56,
    height: 72,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docThumbGreen: {
    backgroundColor: '#EAF7EB',
  },
  docThumbSalmon: {
    backgroundColor: '#FBEDE8',
  },
  docThumbText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  docThumbTextGreen: {
    color: '#3DBE45',
  },
  docThumbTextSalmon: {
    color: '#D38576',
  },
  docThumbFold: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderLeftColor: 'transparent',
    borderTopWidth: 12,
  },
  docThumbFoldGreen: {
    borderTopColor: '#D4EBD6',
  },
  docThumbFoldSalmon: {
    borderTopColor: '#F5D9D1',
  },
  docInfo: {
    flex: 1,
  },
  docTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14.5,
    color: '#1A2027',
  },
  docMeta: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#5A6470',
    marginTop: 4,
  },
  docExtra: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11.5,
    color: '#9AA3AC',
    marginTop: 8,
  },
  docActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  docActionBtnPrimary: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: '#3DBE45',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  docActionTextPrimary: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#fff',
  },
  docActionBtnSecondary: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E6E8EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  docActionTextSecondary: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#5A6470',
  },
  videoCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#1A2027',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  videoThumb: {
    height: 130,
    backgroundColor: '#EAF7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 5,
  },
  videoDurationBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  videoDurationText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    color: '#fff',
  },
  videoInfo: {
    padding: 14,
  },
  videoTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#1A2027',
  },
  videoSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11.5,
    color: '#9AA3AC',
    marginTop: 4,
  },
  sheetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
  },
  sheetItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E6E8EB',
    borderRadius: 14,
    gap: 10,
  },
  sheetItemActive: {
    backgroundColor: '#EAF7EB',
    borderColor: '#3DBE45',
  },
  sheetIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetIconWrapActive: {
    backgroundColor: '#3DBE45',
  },
  sheetIconText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
    color: '#5A6470',
  },
  sheetIconTextActive: {
    color: '#fff',
  },
  sheetItemLabel: {
    flex: 1,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12.5,
    color: '#1A2027',
  },
  sheetItemLabelActive: {
    color: '#3DBE45',
  },
});
