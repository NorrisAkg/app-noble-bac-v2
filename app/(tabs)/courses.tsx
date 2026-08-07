import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ChevronDown, BookOpen, Lock } from 'lucide-react-native';

import { courseService } from '@/services/courseService';
import type { Chapter, ChapterVideoListItem, Lesson, RevisionSheetListItem, Subject } from '@/types/api';
import { SubjectChips } from '@/components/courses/SubjectChips';
import { TabChips } from '@/components/courses/TabChips';
import { ChapterSheetAccordion } from '@/components/courses/ChapterSheetAccordion';
import { ChapterVideoAccordion } from '@/components/courses/ChapterVideoAccordion';
import { EmptyState } from '@/components/ui/EmptyState';
import { IllustrationEmptyCourses } from '@/components/ui/EmptyIllustrations';
import { usePremiumGate, isResourceFree } from '@/hooks/usePremiumGate';
import { queryKeys } from '@/lib/queryKeys';

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

  const subjectsQuery = useQuery({
    queryKey: queryKeys.courses.subjects(),
    queryFn: courseService.getSubjects,
  });
  const apiSubjects = subjectsQuery.data;
  const subjectsLoading = subjectsQuery.isLoading;

  const subjects: SubjectChip[] = (apiSubjects ?? []).map((s: Subject) => ({
    k: String(s.id),
    label: s.short_name ?? s.name,
    id: s.id,
  }));

  const [selectedSubject, setSelectedSubject] = useState<SubjectChip | null>(null);
  const [tab, setTab] = useState<CourseTabKey>('cours');

  useEffect(() => {
    if (!selectedSubject && subjects.length > 0) {
      setSelectedSubject(subjects[0]);
    }
  }, [subjects, selectedSubject]);

  const chaptersQuery = useQuery({
    queryKey: queryKeys.courses.chapters(selectedSubject?.id),
    queryFn: () => courseService.getChapters(selectedSubject!.id),
    enabled: !!selectedSubject,
  });
  const chapters = chaptersQuery.data;
  const chaptersLoading = chaptersQuery.isLoading;

  // Les flags `has_revision_sheet` / `has_video` peuvent changer côté admin
  // après le premier chargement des chapitres (écran monté une seule fois
  // par session, cache React Query non revalidé automatiquement). On force
  // un refetch à chaque bascule vers ces sous-onglets pour éviter un "Aucune
  // fiche/vidéo" obsolète tant que l'utilisateur n'a pas fait de pull.
  // Ne doit se redéclencher qu'au changement d'onglet ; chaptersQuery est un
  // nouvel objet à chaque rendu (l'inclure boucherait l'effet en continu).
  useEffect(() => {
    if (selectedSubject && (tab === 'fiches' || tab === 'videos')) {
      chaptersQuery.refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Onglets Fiches / Vidéos : on n'affiche que les chapitres ayant au moins
  // une fiche / vidéo publiée (flags `has_revision_sheet` / `has_video`).
  const sheetChapters = (chapters ?? []).filter((c) => c.has_revision_sheet);
  const videoChapters = (chapters ?? []).filter((c) => c.has_video);

  // Pour le tab `cours`, on garde la 1re section ouverte par défaut quand la
  // liste change (changement de matière). Les tabs `fiches` / `videos` ont
  // leur propre état d'ouverture (voir ci-dessous).
  const [openChapterId, setOpenChapterId] = useState<number | null>(null);
  useEffect(() => {
    setOpenChapterId(chapters && chapters.length > 0 ? chapters[0].id : null);
  }, [chapters]);

  // Onglets Fiches / Vidéos : accordéons indépendants de celui du tab `cours`,
  // aucune section ouverte par défaut.
  const [openSheetChapterId, setOpenSheetChapterId] = useState<number | null>(null);
  const [openVideoChapterId, setOpenVideoChapterId] = useState<number | null>(null);

  const subjectLabel = selectedSubject?.label ?? '';

  const { guard } = usePremiumGate();

  // Clic isolé par fiche : chaque fiche du chapitre déplié a son propre
  // handler, gaté individuellement sur son propre flag `is_free` (pas de
  // fetch-then-guess sur une fiche devinée).
  const handleOpenSheet = (sheet: RevisionSheetListItem) => {
    guard(sheet, () => {
      router.push({
        pathname: '/pdf-viewer',
        params: { revisionSheetId: String(sheet.id), title: sheet.title, subject: subjectLabel },
      });
    });
  };

  // Clic isolé par vidéo : chaque vidéo du chapitre déplié a son propre
  // handler, gaté individuellement sur son propre flag `is_free` (pas de
  // fetch-then-guess sur une vidéo devinée).
  const handleOpenVideo = (video: ChapterVideoListItem) => {
    guard(video, () => {
      router.push({
        pathname: '/chapter-video',
        params: { videoId: String(video.id), title: video.title, subject: subjectLabel },
      });
    });
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
            <EmptyState
              illustration={IllustrationEmptyCourses}
              title="Aucun chapitre"
              description="Aucun chapitre n'est encore disponible pour cette matière."
            />
          )}

          {!chaptersLoading && chapters && chapters.length > 0 && tab === 'fiches' && sheetChapters.length === 0 && (
            <EmptyState
              illustration={IllustrationEmptyCourses}
              title="Aucune fiche"
              description="Aucune fiche n'est encore disponible pour cette matière."
            />
          )}

          {!chaptersLoading && chapters && chapters.length > 0 && tab === 'videos' && videoChapters.length === 0 && (
            <EmptyState
              illustration={IllustrationEmptyCourses}
              title="Aucune vidéo"
              description="Aucune vidéo n'est encore disponible pour cette matière."
            />
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

          {/* Fiches : accordéon par chapitre, chaque fiche PDF est cliquée
              individuellement (guard() par fiche, pas de fetch-then-guess). */}
          {!chaptersLoading && chapters && tab === 'fiches' && sheetChapters.map((chapter) => (
            <ChapterSheetAccordion
              key={chapter.id}
              chapter={chapter}
              open={openSheetChapterId === chapter.id}
              onToggle={() => setOpenSheetChapterId(openSheetChapterId === chapter.id ? null : chapter.id)}
              onOpenSheet={handleOpenSheet}
            />
          ))}

          {/* Vidéos : accordéon par chapitre, chaque vidéo est cliquée
              individuellement (guard() par vidéo, pas de fetch-then-guess). */}
          {!chaptersLoading && chapters && tab === 'videos' && videoChapters.map((chapter) => (
            <ChapterVideoAccordion
              key={chapter.id}
              chapter={chapter}
              open={openVideoChapterId === chapter.id}
              onToggle={() => setOpenVideoChapterId(openVideoChapterId === chapter.id ? null : chapter.id)}
              onOpenVideo={handleOpenVideo}
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
    queryKey: queryKeys.courses.lessons(chapter.id),
    queryFn: () => courseService.getLessons(chapter.id),
    enabled: open,
  });

  const { guard, isPremium } = usePremiumGate();

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
            hideLockIcon={isPremium}
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
  hideLockIcon,
  onPress,
}: {
  loading: boolean;
  lessons: Lesson[];
  hideLockIcon?: boolean;
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
          {!isResourceFree(lesson) && !hideLockIcon && <Lock size={14} color="#9AA3AC" />}
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
