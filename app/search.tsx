import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Search as SearchIcon, X, Clock, ArrowUpRight, ChevronRight } from 'lucide-react-native';

import { SubjectIcon, type SubjectKind } from '@/components/ui/SubjectIcon';
import { C } from '@/constants/theme';
import { courseService } from '@/services/courseService';
import { catalogService } from '@/services/catalogService';
import type { Book } from '@/types/api';

/**
 * Recherche globale — aligné `templates/screens-plan-search.jsx:178-308`.
 *
 * **Limite backend** : pas d'endpoint `/search` cross-domain
 * (cf. `docs/BACKEND_GAPS.md` section 5.3). On filtre localement sur le
 * catalogue déjà chargé (subjects + books). Pas de `récents` ni
 * d'`en vogue` réels — affichés en stub statique. À remplacer dès que
 * l'API expose la recherche backend.
 */

const STUB_RECENT = [
  'Suites géométriques',
  'BAC 2023',
  'Reproduction humaine',
  'Dissertation philo',
];

interface TrendingItem {
  label: string;
  kind: SubjectKind;
}

const STUB_TRENDING: TrendingItem[] = [
  { label: 'Mathématiques · Probabilités', kind: 'maths' },
  { label: 'Physique · Optique', kind: 'phys' },
  { label: 'Français · Argumentation', kind: 'fr' },
];

type ResultType = 'sujet' | 'quiz' | 'video' | 'lesson' | 'book';

interface SearchResult {
  type: ResultType;
  id: number;
  title: string;
  subtitle: string;
  onPress: () => void;
}

const RESULT_TYPE_STYLES: Record<ResultType, { bg: string; fg: string; label: string }> = {
  sujet:  { bg: C.salmonSoft,   fg: C.salmonDark, label: 'PDF' },
  quiz:   { bg: C.greenSoft,    fg: C.green,      label: '?'   },
  video:  { bg: '#E0EAFF',      fg: '#3D5BBE',    label: '▶'   },
  lesson: { bg: C.greenSoft,    fg: C.green,      label: 'L'   },
  book:   { bg: C.salmonSoft,   fg: C.salmonDark, label: 'B'   },
};

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => courseService.getSubjects(),
    staleTime: 10 * 60 * 1000,
  });

  const { data: booksList } = useQuery({
    queryKey: ['books', 'search'],
    queryFn: () => catalogService.getBooks({ per_page: 50 }),
    staleTime: 60 * 1000,
    enabled: query.length > 0,
  });

  const books: Book[] = useMemo(() => booksList?.data ?? [], [booksList]);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return [];

    const subjectResults: SearchResult[] = subjects
      .filter((s) => s.name.toLowerCase().includes(q))
      .slice(0, 5)
      .map((s) => ({
        type: 'lesson' as const,
        id: s.id,
        title: s.name,
        subtitle: `${s.chapter_count} chapitres`,
        onPress: () => router.push({
          pathname: '/quiz-session',
          params: {
            subjectId: String(s.id),
            subjectLabel: s.name,
          },
        }),
      }));

    const bookResults: SearchResult[] = books
      .filter((b) => b.title.toLowerCase().includes(q))
      .slice(0, 5)
      .map((b) => ({
        type: 'book' as const,
        id: b.id,
        title: b.title,
        subtitle: `${b.author ?? 'Auteur inconnu'} · ${b.page_count ?? '?'} pages`,
        onPress: () => router.push({
          pathname: '/pdf-viewer',
          params: { bookId: String(b.id), title: b.title },
        }),
      }));

    return [...subjectResults, ...bookResults];
  }, [query, subjects, books, router]);

  const clearQuery = () => setQuery('');

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={{ height: insets.top, backgroundColor: C.green }} />

      {/* Header search bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ChevronLeft size={18} color="#fff" strokeWidth={2.4} />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <SearchIcon size={16} color="#fff" strokeWidth={2} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            autoFocus
            placeholder="Matière, chapitre, année…"
            placeholderTextColor="rgba(255,255,255,0.7)"
            style={styles.searchInput}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clearQuery} style={styles.clearBtn}>
              <X size={12} color="#fff" strokeWidth={2.4} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {query.length === 0 ? (
          <>
            <SectionHead title="Récents" />
            <View style={styles.recentRow}>
              {STUB_RECENT.map((r) => (
                <TouchableOpacity
                  key={r}
                  onPress={() => setQuery(r)}
                  style={styles.recentChip}
                  activeOpacity={0.7}
                >
                  <Clock size={11} color={C.ink3} strokeWidth={2} />
                  <Text style={styles.recentText}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <SectionHead title="En vogue" />
            {STUB_TRENDING.map((t, i) => (
              <TouchableOpacity
                key={i}
                style={styles.trendingCard}
                onPress={() => setQuery(t.label)}
                activeOpacity={0.7}
              >
                <SubjectIcon kind={t.kind} size={36} />
                <Text style={styles.trendingLabel}>{t.label}</Text>
                <ArrowUpRight size={14} color={C.ink3} strokeWidth={1.8} />
              </TouchableOpacity>
            ))}
          </>
        ) : (
          <>
            <Text style={styles.resultsHint}>
              {results.length} résultat{results.length > 1 ? 's' : ''} pour
              {' '}<Text style={{ color: C.ink, fontFamily: 'Poppins_600SemiBold' }}>« {query} »</Text>
            </Text>

            {results.length === 0 && (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>
                  Aucun résultat. Essaie un autre terme ou une matière.
                </Text>
              </View>
            )}

            {results.map((r) => {
              const palette = RESULT_TYPE_STYLES[r.type];
              return (
                <TouchableOpacity
                  key={`${r.type}-${r.id}`}
                  onPress={r.onPress}
                  style={styles.resultCard}
                  activeOpacity={0.7}
                >
                  <View style={[styles.resultIcon, { backgroundColor: palette.bg }]}>
                    <Text style={[styles.resultIconText, { color: palette.fg }]}>
                      {palette.label}
                    </Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.resultTitle} numberOfLines={1}>
                      {r.title}
                    </Text>
                    <Text style={styles.resultSubtitle} numberOfLines={1}>
                      {r.subtitle}
                    </Text>
                  </View>
                  <ChevronRight size={14} color={C.ink3} strokeWidth={2} />
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

interface SectionHeadProps {
  title: string;
}

const SectionHead: React.FC<SectionHeadProps> = ({ title }) => (
  <View style={styles.sectionHeadRow}>
    <Text style={styles.sectionHeadTitle}>{title}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    backgroundColor: C.green,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: '#fff',
    padding: 0,
  },
  clearBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionHeadRow: {
    marginBottom: 10,
  },
  sectionHeadTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
    color: C.ink,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  recentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 22,
  },
  recentChip: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: C.line,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recentText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12.5,
    color: C.ink,
  },
  trendingCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    shadowColor: C.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  trendingLabel: {
    flex: 1,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13.5,
    color: C.ink,
  },
  resultsHint: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: C.ink3,
    marginBottom: 10,
  },
  emptyBox: {
    paddingVertical: 48,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13.5,
    color: C.ink3,
    textAlign: 'center',
    lineHeight: 20,
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    shadowColor: C.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultIconText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  resultTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13.5,
    color: C.ink,
  },
  resultSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11.5,
    color: C.ink3,
    marginTop: 2,
  },
});
