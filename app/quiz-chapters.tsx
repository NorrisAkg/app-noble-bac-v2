import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useQuery } from '@tanstack/react-query';
import Svg, { Path, Rect } from 'react-native-svg';
import { X } from 'lucide-react-native';

import { SubjectIcon, backendSlugToSubjectKind } from '@/components/ui/SubjectIcon';
import { courseService } from '@/services/courseService';
import { C } from '@/constants/theme';
import type { Chapter } from '@/types/api';

/**
 * Écran « Chapitres par matière » — aligné `templates/screens-quiz-config.jsx`.
 *
 * Limite backend connue : `POST /quiz/sessions` ne prend que `subject_id`,
 * pas `chapter_id`. Tap sur un chapitre lance une session sur toute la matière.
 * Lorsque le backend exposera des quiz par chapitre, on passera `chapterId`
 * au routeur.
 */
export default function QuizChaptersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { subjectId, subjectLabel = 'Quiz', subjectSlug } = useLocalSearchParams<{
    subjectId: string;
    subjectLabel?: string;
    subjectSlug?: string;
  }>();

  const numericSubjectId = subjectId ? Number(subjectId) : null;

  const { data: chapters = [], isLoading, isError } = useQuery({
    queryKey: ['chapters', numericSubjectId],
    queryFn: () => courseService.getChapters(numericSubjectId as number),
    enabled: numericSubjectId !== null,
  });

  const subjectKind = backendSlugToSubjectKind(subjectSlug);

  const startQuiz = () => {
    if (!numericSubjectId) return;
    router.push({
      pathname: '/quiz-session',
      params: {
        subjectId: String(numericSubjectId),
        subjectLabel,
      },
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={{ height: insets.top, backgroundColor: C.green }} />

      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.closeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={20} color="#fff" strokeWidth={2.4} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{subjectLabel}</Text>
          <View style={styles.closeBtn} />
        </View>
        <Text style={styles.headerHelper}>
          {chapters.length} chapitre{chapters.length > 1 ? 's' : ''} · 20 questions par quiz
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && (
          <View style={styles.loaderBox}>
            <ActivityIndicator color={C.green} size="large" />
          </View>
        )}

        {!isLoading && isError && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              Impossible de charger les chapitres. Réessaie plus tard.
            </Text>
          </View>
        )}

        {!isLoading && !isError && chapters.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              Aucun chapitre n&apos;est encore disponible pour cette matière.
              {'\n'}Les quiz arrivent bientôt.
            </Text>
          </View>
        )}

        {!isLoading && chapters.map((chapter) => (
          <ChapterCard
            key={chapter.id}
            chapter={chapter}
            subjectKind={subjectKind}
            onPress={startQuiz}
          />
        ))}
      </ScrollView>
    </View>
  );
}

interface ChapterCardProps {
  chapter: Chapter;
  subjectKind: ReturnType<typeof backendSlugToSubjectKind>;
  onPress: () => void;
}

/** État du chapitre : padlock vert (pas démarré).
 * Le backend ne tracke pas (encore) la progression par chapitre, donc on
 * affiche toujours le padlock pour rester honnête. À étendre quand l'API
 * exposera un `chapter_progress`. */
const ChapterCard: React.FC<ChapterCardProps> = ({ chapter, subjectKind, onPress }) => (
  <TouchableOpacity
    activeOpacity={0.85}
    onPress={onPress}
    style={styles.card}
  >
    <SubjectIcon kind={subjectKind} size={56} />
    <View style={styles.cardBody}>
      <Text style={styles.cardTitle} numberOfLines={2}>
        {chapter.title}
      </Text>
      <Text style={styles.cardSubText}>Commencer le Quiz</Text>
    </View>
    <ChapterStatusBadge />
  </TouchableOpacity>
);

const ChapterStatusBadge: React.FC = () => (
  <View style={styles.statusBox}>
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x={5} y={11} width={14} height={10} rx={2} stroke={C.green} strokeWidth={2.2} fill="none" />
      <Path d="M8 11 V8 a4 4 0 0 1 8 0 V11" stroke={C.green} strokeWidth={2.2} strokeLinecap="round" fill="none" />
    </Svg>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    backgroundColor: C.green,
    paddingTop: 4,
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  headerRow: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: '#fff',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  headerHelper: {
    marginTop: 2,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
    lineHeight: 16,
  },
  list: {
    padding: 16,
  },
  loaderBox: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyBox: {
    paddingVertical: 60,
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#1A2027',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 2,
    marginBottom: 10,
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: C.ink,
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  cardSubText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12.5,
    color: '#9C8BC9',
    marginTop: 4,
  },
  statusBox: {
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
