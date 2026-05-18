import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, FileText, Video, BookOpen, Lock } from 'lucide-react-native';

import { courseService } from '@/services/courseService';
import type { Chapter, Lesson, RevisionSheetListItem, ChapterVideoListItem, Subject } from '@/types/api';
import { SubjectChips } from '@/components/courses/SubjectChips';
import { TabChips } from '@/components/courses/TabChips';

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

  const { data: apiSubjects, isLoading: subjectsLoading } = useQuery({
    queryKey: ['courses', 'subjects'],
    queryFn: courseService.getSubjects,
  });

  const subjects: SubjectChip[] = (apiSubjects ?? []).map((s: Subject) => ({
    k: String(s.id),
    label: s.name,
    id: s.id,
  }));

  const [selectedSubject, setSelectedSubject] = useState<SubjectChip | null>(null);
  const [tab, setTab] = useState<CourseTabKey>('cours');

  useEffect(() => {
    if (!selectedSubject && subjects.length > 0) {
      setSelectedSubject(subjects[0]);
    }
  }, [subjects, selectedSubject]);

  const { data: chapters, isLoading: chaptersLoading } = useQuery({
    queryKey: ['courses', 'chapters', selectedSubject?.id],
    queryFn: () => courseService.getChapters(selectedSubject!.id),
    enabled: !!selectedSubject,
  });

  const [openChapterId, setOpenChapterId] = useState<number | null>(null);

  useEffect(() => {
    setOpenChapterId(chapters && chapters.length > 0 ? chapters[0].id : null);
  }, [chapters, tab]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={{ height: insets.top, backgroundColor: '#3DBE45' }} />

      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>{selectedSubject?.label ?? 'Cours'}</Text>
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
        >
          {chaptersLoading && (
            <ActivityIndicator size="large" color="#3DBE45" style={{ marginTop: 40 }} />
          )}

          {!chaptersLoading && chapters && chapters.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Aucun chapitre pour cette matière.</Text>
            </View>
          )}

          {!chaptersLoading && chapters && chapters.map((chapter) => (
            <ChapterAccordion
              key={chapter.id}
              chapter={chapter}
              tab={tab}
              open={openChapterId === chapter.id}
              onToggle={() => setOpenChapterId(openChapterId === chapter.id ? null : chapter.id)}
              subjectLabel={selectedSubject?.label ?? ''}
              router={router}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

interface ChapterAccordionProps {
  chapter: Chapter;
  tab: CourseTabKey;
  open: boolean;
  onToggle: () => void;
  subjectLabel: string;
  router: ReturnType<typeof useRouter>;
}

function ChapterAccordion({ chapter, tab, open, onToggle, subjectLabel, router }: ChapterAccordionProps) {
  const { data: lessons, isLoading: lessonsLoading } = useQuery({
    queryKey: ['courses', 'lessons', chapter.id],
    queryFn: () => courseService.getLessons(chapter.id),
    enabled: open && tab === 'cours',
  });

  const { data: sheets, isLoading: sheetsLoading } = useQuery({
    queryKey: ['courses', 'revision-sheets', chapter.id],
    queryFn: () => courseService.getRevisionSheetsByChapter(chapter.id),
    enabled: open && tab === 'fiches',
  });

  const { data: videos, isLoading: videosLoading } = useQuery({
    queryKey: ['courses', 'chapter-videos', chapter.id],
    queryFn: () => courseService.getChapterVideosByChapter(chapter.id),
    enabled: open && tab === 'videos',
  });

  const handleOpenLesson = (lesson: Lesson) => {
    router.push({
      pathname: '/course-reader',
      params: { lessonId: String(lesson.id), subject: subjectLabel },
    });
  };

  const handleOpenSheet = (sheet: RevisionSheetListItem) => {
    router.push({
      pathname: '/pdf-viewer',
      params: { revisionSheetId: String(sheet.id), title: sheet.title, subject: subjectLabel },
    });
  };

  const handleOpenVideo = (video: ChapterVideoListItem) => {
    router.push({
      pathname: '/chapter-video',
      params: { videoId: String(video.id), title: video.title, subject: subjectLabel },
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
          <ChevronDown size={18} color="#5A6470" />
        </View>
      </TouchableOpacity>

      {open && (
        <View style={accordionStyles.body}>
          {tab === 'cours' && (
            <ChapterContentList
              loading={lessonsLoading}
              items={(lessons ?? []).map((l) => ({
                id: l.id,
                title: l.title,
                subtitle: l.duration_minutes ? `${l.duration_minutes} min` : null,
                isFree: l.is_free,
                icon: 'lesson',
                onPress: () => handleOpenLesson(l),
              }))}
              emptyLabel="Aucune leçon pour ce chapitre."
            />
          )}
          {tab === 'fiches' && (
            <ChapterContentList
              loading={sheetsLoading}
              items={(sheets ?? []).map((s) => ({
                id: s.id,
                title: s.title,
                subtitle: s.file_size_kb ? `${Math.round(s.file_size_kb / 100) / 10} Mo` : null,
                isFree: s.is_free,
                icon: 'sheet',
                onPress: () => handleOpenSheet(s),
              }))}
              emptyLabel="Aucune fiche pour ce chapitre."
            />
          )}
          {tab === 'videos' && (
            <ChapterContentList
              loading={videosLoading}
              items={(videos ?? []).map((v) => ({
                id: v.id,
                title: v.title,
                subtitle: v.duration_sec ? formatDuration(v.duration_sec) : null,
                isFree: v.is_free,
                icon: 'video',
                onPress: () => handleOpenVideo(v),
              }))}
              emptyLabel="Aucune vidéo pour ce chapitre."
            />
          )}
        </View>
      )}
    </View>
  );
}

interface ContentItem {
  id: number;
  title: string;
  subtitle: string | null;
  isFree: boolean;
  icon: 'lesson' | 'sheet' | 'video';
  onPress: () => void;
}

function ChapterContentList({
  loading,
  items,
  emptyLabel,
}: {
  loading: boolean;
  items: ContentItem[];
  emptyLabel: string;
}) {
  if (loading) {
    return <ActivityIndicator size="small" color="#3DBE45" style={{ marginVertical: 16 }} />;
  }
  if (items.length === 0) {
    return <Text style={accordionStyles.empty}>{emptyLabel}</Text>;
  }
  return (
    <View style={{ gap: 8 }}>
      {items.map((item) => (
        <TouchableOpacity
          key={item.id}
          onPress={item.onPress}
          activeOpacity={0.7}
          style={accordionStyles.row}
        >
          <View style={accordionStyles.rowIcon}>
            {item.icon === 'lesson' && <BookOpen size={16} color="#3DBE45" />}
            {item.icon === 'sheet' && <FileText size={16} color="#3DBE45" />}
            {item.icon === 'video' && <Video size={16} color="#3DBE45" />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={accordionStyles.rowTitle} numberOfLines={1}>{item.title}</Text>
            {item.subtitle && <Text style={accordionStyles.rowSubtitle}>{item.subtitle}</Text>}
          </View>
          {!item.isFree && <Lock size={14} color="#9AA3AC" />}
        </TouchableOpacity>
      ))}
    </View>
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m} min` : `${m}:${String(s).padStart(2, '0')}`;
}

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
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
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
