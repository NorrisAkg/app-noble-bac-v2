import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { courseService } from '@/services/courseService';
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
      console.error("Failed to load subjects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePickSubject = (subjectId: number, subjectLabel: string) => {
    router.push({
      pathname: '/quiz-session',
      params: { subjectId: subjectId.toString(), subjectLabel },
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Status bar spacer */}
      <View style={{ height: insets.top, backgroundColor: '#3DBE45' }} />

      {/* App bar */}
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>Quiz</Text>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#3DBE45" />
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
            Sélectionne une matière pour voir les chapitres disponibles.
          </Text>

          <View style={styles.grid}>
            {subjects.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => handlePickSubject(s.id, s.name)}
              >
                <View style={styles.iconWrap}>
                  <Text style={styles.iconText}>{s.name.substring(0, 3).toUpperCase()}</Text>
                </View>
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
    color: '#1A2027',
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  headerSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13.5,
    color: '#5A6470',
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
    shadowColor: '#1A2027',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 4,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EAF7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  iconText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: '#3DBE45',
  },
  cardTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: '#1A2027',
    textAlign: 'center',
    marginBottom: 2,
    width: '100%',
  },
  cardCount: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11.5,
    color: '#9AA3AC',
    textAlign: 'center',
  },
});
