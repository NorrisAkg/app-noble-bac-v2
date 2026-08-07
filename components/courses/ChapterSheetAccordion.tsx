import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { ChevronDown, FileText, Lock } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';

import { courseService } from '@/services/courseService';
import type { Chapter, RevisionSheetListItem } from '@/types/api';
import { isResourceFree } from '@/hooks/usePremiumGate';
import { queryKeys } from '@/lib/queryKeys';

interface ChapterSheetAccordionProps {
  chapter: Chapter;
  open: boolean;
  onToggle: () => void;
  hideLockIcon?: boolean;
  onOpenSheet: (sheet: RevisionSheetListItem) => void;
}

export function ChapterSheetAccordion({
  chapter,
  open,
  onToggle,
  hideLockIcon,
  onOpenSheet,
}: ChapterSheetAccordionProps) {
  const { data: sheets, isLoading: sheetsLoading } = useQuery({
    queryKey: queryKeys.courses.revisionSheets(chapter.id),
    queryFn: () => courseService.getRevisionSheetsByChapter(chapter.id),
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
          <SheetList
            loading={sheetsLoading}
            sheets={sheets ?? []}
            hideLockIcon={hideLockIcon}
            onPress={onOpenSheet}
          />
        </View>
      )}
    </View>
  );
}

function SheetList({
  loading,
  sheets,
  hideLockIcon,
  onPress,
}: {
  loading: boolean;
  sheets: RevisionSheetListItem[];
  hideLockIcon?: boolean;
  onPress: (sheet: RevisionSheetListItem) => void;
}) {
  if (loading) {
    return <ActivityIndicator size="small" color="#3DBE45" style={{ marginVertical: 16 }} />;
  }
  if (sheets.length === 0) {
    return <Text style={styles.empty}>Aucune fiche pour ce chapitre.</Text>;
  }
  return (
    <View style={{ gap: 8 }}>
      {sheets.map((sheet) => (
        <TouchableOpacity
          key={sheet.id}
          onPress={() => onPress(sheet)}
          activeOpacity={0.7}
          style={styles.row}
        >
          <View style={styles.rowIcon}>
            <FileText size={16} color="#3B8FD4" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle} numberOfLines={1}>{sheet.title}</Text>
            {sheet.file_size_kb ? (
              <Text style={styles.rowSubtitle}>{Math.round(sheet.file_size_kb / 1024)} Mo</Text>
            ) : null}
          </View>
          {!isResourceFree(sheet) && !hideLockIcon && <Lock size={14} color="#9AA3AC" />}
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
    backgroundColor: '#D6EAFF',
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
