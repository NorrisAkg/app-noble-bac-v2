import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { courseService } from '@/services/courseService';
import { SubjectIcon, backendSlugToSubjectKind } from '@/components/ui/SubjectIcon';
import { C } from '@/constants/theme';
import type { Subject } from '@/types/api';

export default function QuizSubjectsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const data = await courseService.getSubjects();
      setSubjects(data);
    } catch (error) {
      console.error('Failed to load subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePickSubject = (subject: Subject) => {
    router.push({
      pathname: '/quiz-chapters',
      params: {
        subjectId: subject.id.toString(),
        subjectLabel: subject.name,
        subjectSlug: subject.icon_slug ?? '',
      },
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={{ height: insets.top, backgroundColor: C.green }} />

      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>Quiz</Text>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={C.green} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.headerTitle}>
            Teste-toi sur toutes{'\n'}les matières
          </Text>
          <Text style={styles.headerSubtitle}>
            20 questions par chapitre · explications incluses.
          </Text>

          <View style={styles.grid}>
            {subjects.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => handlePickSubject(s)}
              >
                <SubjectIcon kind={backendSlugToSubjectKind(s.icon_slug)} size={52} />
                <Text style={styles.cardTitle} numberOfLines={1}>{s.name}</Text>
                <Text style={styles.cardCount}>{s.chapter_count || 0} chapitres</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  appBar: {
    height: 64,
    backgroundColor: C.green,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  appBarTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 17,
    color: '#fff',
  },
  content: {
    padding: 20,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: C.ink,
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  headerSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13.5,
    color: C.ink2,
    marginTop: 6,
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    shadowColor: C.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 4,
  },
  cardTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: C.ink,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 2,
    width: '100%',
  },
  cardCount: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11.5,
    color: C.ink3,
    textAlign: 'center',
  },
});
