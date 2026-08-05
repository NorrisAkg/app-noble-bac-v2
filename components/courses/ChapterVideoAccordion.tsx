import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { ChevronDown, PlayCircle, Lock } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';

import { courseService } from '@/services/courseService';
import type { Chapter, ChapterVideoListItem } from '@/types/api';
import { isResourceFree } from '@/hooks/usePremiumGate';

interface ChapterVideoAccordionProps {
  chapter: Chapter;
  open: boolean;
  onToggle: () => void;
  hideLockIcon?: boolean;
  onOpenVideo: (video: ChapterVideoListItem) => void;
}

export function ChapterVideoAccordion({
  chapter,
  open,
  onToggle,
  hideLockIcon,
  onOpenVideo,
}: ChapterVideoAccordionProps) {
  const { data: videos, isLoading: videosLoading } = useQuery({
    queryKey: ['courses', 'chapter-videos', chapter.id],
    queryFn: () => courseService.getChapterVideosByChapter(chapter.id),
    enabled: open,
  });

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={onToggle} activeOpacity={0.7} style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.order}>Chapitre {chapter.order}</Text>
          <Text style={styles.title} numberOfLines={2}>{chapter.title}</Text>
        </View>
        <View style={[styles.chevron, open && styles.chevronOpen]}>
          <ChevronDown size={16} color="#7B5BD6" strokeWidth={2.4} />
        </View>
      </TouchableOpacity>

      {open && (
        <View style={styles.body}>
          <VideoList
            loading={videosLoading}
            videos={videos ?? []}
            hideLockIcon={hideLockIcon}
            onPress={onOpenVideo}
          />
        </View>
      )}
    </View>
  );
}

function formatDuration(seconds: number | null): string | null {
  if (!seconds) return null;
  const minutes = Math.round(seconds / 60);
  if (minutes < 1) return '< 1 min';
  return `${minutes} min`;
}

function VideoList({
  loading,
  videos,
  hideLockIcon,
  onPress,
}: {
  loading: boolean;
  videos: ChapterVideoListItem[];
  hideLockIcon?: boolean;
  onPress: (video: ChapterVideoListItem) => void;
}) {
  if (loading) {
    return <ActivityIndicator size="small" color="#3DBE45" style={{ marginVertical: 16 }} />;
  }
  if (videos.length === 0) {
    return <Text style={styles.empty}>Aucune vidéo pour ce chapitre.</Text>;
  }
  return (
    <View style={{ gap: 8 }}>
      {videos.map((video) => (
        <TouchableOpacity
          key={video.id}
          onPress={() => onPress(video)}
          activeOpacity={0.7}
          style={styles.row}
        >
          <View style={styles.rowIcon}>
            <PlayCircle size={16} color="#E23F3F" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle} numberOfLines={1}>{video.title}</Text>
            {formatDuration(video.duration_sec) ? (
              <Text style={styles.rowSubtitle}>{formatDuration(video.duration_sec)}</Text>
            ) : null}
          </View>
          {!isResourceFree(video) && !hideLockIcon && <Lock size={14} color="#9AA3AC" />}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: '#FBE2E2',
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
