import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChevronDown, BookOpen, Lock } from 'lucide-react-native';

import { courseService } from '@/services/courseService';
import type { Chapter, Lesson, Subject } from '@/types/api';
import { SubjectChips } from '@/components/courses/SubjectChips';
import { TabChips } from '@/components/courses/TabChips';
import { ChapterRowCard } from '@/components/courses/ChapterRowCard';
import { usePremiumGate } from '@/hooks/usePremiumGate';

type CourseTabKey = 'cours' | 'fiches' | 'videos';

const COURSE_TABS: { k: CourseTabKey; label: string }[] = [
  { k: 'cours', label: 'Cours' },
  { k: 'fiches', label: 'Fiches' },
  { k: 'videos', label: 'Vidéos' },
];

interface SubjectChip {
  k: string;
  label: string;
  id: number;
}

export default function CoursesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

  const subjectsQuery = useQuery({
    queryKey: ['courses', 'subjects'],
    queryFn: courseService.getSubjects,
  });
  const apiSubjects = subjectsQuery.data;
  const subjectsLoading = subjectsQuery.isLoading;

  const subjects: SubjectChip[] = (apiSubjects ?? []).map((s: Subject) => ({
    k: String(s.id),
    label: s.name,
    id: s.id,
  }));

  const [selectedSubject, setSelectedSubject] = useState<SubjectChip | null>(null);
  const [tab, setTab] = useState<CourseTabKey>('cours');
  const [openingChapterId, setOpeningChapterId] = useState<number | null>(null);

  useEffect(() => {
    if (!selectedSubject && subjects.length > 0) {
      setSelectedSubject(subjects[0]);
    }
  }, [subjects, selectedSubject]);

  const chaptersQuery = useQuery({
    queryKey: ['courses', 'chapters', selectedSubject?.id],
    queryFn: () => courseService.getChapters(selectedSubject!.id),
    enabled: !!selectedSubject,
  });
  const chapters = chaptersQuery.data;
  const chaptersLoading = chaptersQuery.isLoading;

  // Pour le tab `cours`, on garde la 1re section ouverte par défaut quand la
  // liste change (changement de matière). Pour les autres tabs (flat list),
  // pas d'état d'ouverture nécessaire.
  const [openChapterId, setOpenChapterId] = useState<number | null>(null);
  useEffect(() => {
    setOpenChapterId(chapters && chapters.length > 0 ? chapters[0].id : null);
  }, [chapters]);

  const subjectLabel = selectedSubject?.label ?? '';

  const { guard } = usePremiumGate();

  // Tap d'une carte chapitre côté Fiches : on charge la liste des fiches du
  // chapitre et on ouvre la première dans le pdf-viewer. Mêmes principes pour
  // les vidéos. Le backend MVP ne fournit pas de "fiche principale" — on prend
  // simplement la première publiée.
  //
  // Les fiches et vidéos sont 100% Premium par défaut (RM-ACC-07). On gate
  // donc avant le fetch ; en cas d'override admin `is_free=true` sur l'item
  // récupéré, le filet 403 du pdf-viewer/chapter-video reste en place.
  const openFirstRevisionSheet = async (chapter: Chapter) => {
    if (openingChapterId) return;
    setOpeningChapterId(chapter.id);
    try {
      const sheets = await queryClient.fetchQuery({
        queryKey: ['courses', 'revision-sheets', chapter.id],
        queryFn: () => courseService.getRevisionSheetsByChapter(chapter.id),
      });
      const first = sheets[0];
      if (!first) {
        Alert.alert('Pas de fiche', 'Aucune fiche disponible pour ce chapitre.');
        return;
      }
      router.push({
        pathname: '/pdf-viewer',
        params: { revisionSheetId: String(first.id), title: first.title, subject: subjectLabel },
      });
    } catch {
      Alert.alert('Erreur', 'Impossible de charger les fiches de ce chapitre.');
    } finally {
      setOpeningChapterId(null);
    }
  };

  const handleOpenChapterSheet = (chapter: Chapter) => {
    guard({ is_free: false, title: 'cette fiche' }, () => openFirstRevisionSheet(chapter));
  };

  const openFirstChapterVideo = async (chapter: Chapter) => {
    if (openingChapterId) return;
    setOpeningChapterId(chapter.id);
    try {
      const videos = await queryClient.fetchQuery({
        queryKey: ['courses', 'chapter-videos', chapter.id],
        queryFn: () => courseService.getChapterVideosByChapter(chapter.id),
      });
      const first = videos[0];
      if (!first) {
        Alert.alert('Pas de vidéo', 'Aucune vidéo disponible pour ce chapitre.');
        return;
      }
      router.push({
        pathname: '/chapter-video',
        params: { videoId: String(first.id), title: first.title, subject: subjectLabel },
      });
    } catch {
      Alert.alert('Erreur', 'Impossible de charger les vidéos de ce chapitre.');
    } finally {
      setOpeningChapterId(null);
    }
  };

  const handleOpenChapterVideo = (chapter: Chapter) => {
    guard({ is_free: false, title: 'cette vidéo' }, () => openFirstChapterVideo(chapter));
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={{ height: insets.top, backgroundColor: '#3DBE45' }} />

      <View style={styles.appBar}>
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          style={styles.backBtn}
          activeOpacity={0.7}
          accessibilityLabel="Retour"
        >
          <ArrowLeft size={22} color="#fff" strokeWidth={2.4} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle} numberOfLines={1}>
          {selectedSubject?.label ?? 'Cours'}
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        {subjectsLoading && (
          <ActivityIndicator size="small" color="#3DBE45" style={{ marginTop: 12 }} />
        )}

        {!subjectsLoading && subjects.length > 0 && selectedSubject && (
          <SubjectChips
            subjects={subjects}
            value={selectedSubject}
            onChange={(s) => setSelectedSubject(s as SubjectChip)}
          />
        )}

        <TabChips tabs={COURSE_TABS} activeTab={tab} onChange={(k) => setTab(k as CourseTabKey)} />

        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollInner}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={subjectsQuery.isRefetching || chaptersQuery.isRefetching}
              onRefresh={() => {
                subjectsQuery.refetch();
                if (selectedSubject) chaptersQuery.refetch();
              }}
              tintColor="#3DBE45"
            />
          }
        >
          {chaptersLoading && (
            <ActivityIndicator size="large" color="#3DBE45" style={{ marginTop: 40 }} />
          )}

          {!chaptersLoading && chapters && chapters.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Aucun chapitre pour cette matière.</Text>
            </View>
          )}

          {/* Cours : accordéon avec liste de leçons par chapitre. */}
          {!chaptersLoading && chapters && tab === 'cours' && chapters.map((chapter) => (
            <ChapterAccordion
              key={chapter.id}
              chapter={chapter}
              open={openChapterId === chapter.id}
              onToggle={() => setOpenChapterId(openChapterId === chapter.id ? null : chapter.id)}
              subjectLabel={subjectLabel}
              router={router}
            />
          ))}

          {/* Fiches / Vidéos : liste plate de chapitres (aligné maquette
              `screens-courses.jsx:362-385`). Le tap charge la 1re fiche /
              1re vidéo et navigue directement vers le viewer. */}
          {!chaptersLoading && chapters && tab === 'fiches' && chapters.map((chapter) => (
            <ChapterRowCard
              key={chapter.id}
              title={chapter.title}
              subtitle={`Chapitre ${chapter.order} · fiche PDF`}
              mode="pdf"
              loading={openingChapterId === chapter.id}
              onClick={() => handleOpenChapterSheet(chapter)}
            />
          ))}

          {!chaptersLoading && chapters && tab === 'videos' && chapters.map((chapter) => (
            <ChapterRowCard
              key={chapter.id}
              title={chapter.title}
              subtitle={`Chapitre ${chapter.order} · vidéo du chapitre`}
              mode="video"
              loading={openingChapterId === chapter.id}
              onClick={() => handleOpenChapterVideo(chapter)}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

interface ChapterAccordionProps {
  chapter: Chapter;
  open: boolean;
  onToggle: () => void;
  subjectLabel: string;
  router: ReturnType<typeof useRouter>;
}

function ChapterAccordion({ chapter, open, onToggle, subjectLabel, router }: ChapterAccordionProps) {
  const { data: lessons, isLoading: lessonsLoading } = useQuery({
    queryKey: ['courses', 'lessons', chapter.id],
    queryFn: () => courseService.getLessons(chapter.id),
    enabled: open,
  });

  const { guard } = usePremiumGate();

  const handleOpenLesson = (lesson: Lesson) => {
    // Lesson est free si is_free=true OU order=1 (RM-COURS-05). Le helper
    // isResourceFree gère les deux cas via le type Gatedresource.
    guard(lesson, () => {
      router.push({
        pathname: '/course-reader',
        params: { lessonId: String(lesson.id), subject: subjectLabel },
      });
    });
  };

  return (
    <View style={accordionStyles.card}>
      <TouchableOpacity onPress={onToggle} activeOpacity={0.7} style={accordionStyles.header}>
        <View style={accordionStyles.headerLeft}>
          <Text style={accordionStyles.order}>Chapitre {chapter.order}</Text>
          <Text style={accordionStyles.title} numberOfLines={2}>{chapter.title}</Text>
        </View>
        <View style={[accordionStyles.chevron, open && accordionStyles.chevronOpen]}>
          <ChevronDown size={16} color="#7B5BD6" strokeWidth={2.4} />
        </View>
      </TouchableOpacity>

      {open && (
        <View style={accordionStyles.body}>
          <LessonList
            loading={lessonsLoading}
            lessons={lessons ?? []}
            onPress={handleOpenLesson}
          />
        </View>
      )}
    </View>
  );
}

function LessonList({
  loading,
  lessons,
  onPress,
}: {
  loading: boolean;
  lessons: Lesson[];
  onPress: (lesson: Lesson) => void;
}) {
  if (loading) {
    return <ActivityIndicator size="small" color="#3DBE45" style={{ marginVertical: 16 }} />;
  }
  if (lessons.length === 0) {
    return <Text style={accordionStyles.empty}>Aucune leçon pour ce chapitre.</Text>;
  }
  return (
    <View style={{ gap: 8 }}>
      {lessons.map((lesson) => (
        <TouchableOpacity
          key={lesson.id}
          onPress={() => onPress(lesson)}
          activeOpacity={0.7}
          style={accordionStyles.row}
        >
          <View style={accordionStyles.rowIcon}>
            <BookOpen size={16} color="#3DBE45" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={accordionStyles.rowTitle} numberOfLines={1}>{lesson.title}</Text>
            {lesson.duration_minutes ? (
              <Text style={accordionStyles.rowSubtitle}>{lesson.duration_minutes} min</Text>
            ) : null}
          </View>
          {!lesson.is_free && <Lock size={14} color="#9AA3AC" />}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  appBar: {
    height: 64,
    backgroundColor: '#3DBE45',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appBarTitle: {
    flex: 1,
    textAlign: 'center',
    marginRight: 44, // compense la largeur du backBtn pour centrer le titre
    fontFamily: 'Poppins_700Bold',
    fontSize: 17,
    color: '#fff',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 110,
  },
  emptyState: {
    paddingVertical: 40,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13.5,
    color: '#9AA3AC',
  },
});

const accordionStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#1A2027',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  headerLeft: {
    flex: 1,
  },
  order: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    color: '#9AA3AC',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#1A2027',
    lineHeight: 19,
  },
  chevron: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EFEAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  body: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  empty: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12.5,
    color: '#9AA3AC',
    textAlign: 'center',
    paddingVertical: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 12,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EAF7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: '#1A2027',
  },
  rowSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: '#9AA3AC',
    marginTop: 1,
  },
});
