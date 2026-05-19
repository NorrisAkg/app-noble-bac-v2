import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { X } from 'lucide-react-native';

import { quizService } from '@/services/quizService';
import type { QuizSession, QuizSessionQuestion } from '@/services/quizService';
import { useQuizStore } from '@/store/useQuizStore';
import { getApiErrorMessage } from '@/utils/apiError';

export default function QuizSessionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { subjectId, subjectLabel = 'Quiz' } = useLocalSearchParams<{
    subjectId: string;
    subjectLabel?: string;
  }>();

  const [session, setSession] = useState<QuizSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [idx, setIdx] = useState(0);
  const [pickedOptionId, setPickedOptionId] = useState<number | null>(null);

  const setLastFinishedSession = useQuizStore((s) => s.setLastFinishedSession);

  useEffect(() => {
    if (!subjectId) {
      Alert.alert('Erreur', 'Matière introuvable.');
      router.back();
      return;
    }

    (async () => {
      try {
        const data = await quizService.startSession(Number(subjectId));
        setSession(data);
      } catch (error) {
        Alert.alert('Quiz indisponible', getApiErrorMessage(error));
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [subjectId, router]);

  const questions: QuizSessionQuestion[] = session?.questions ?? [];
  const total = questions.length;
  const q = questions[idx];
  const isLast = idx === total - 1;

  const handlePick = (optionId: number) => {
    if (submitting) return;
    setPickedOptionId(optionId);
  };

  const handleNext = async () => {
    if (!session || pickedOptionId === null || submitting) return;

    setSubmitting(true);
    try {
      await quizService.submitAnswer(session.id, q.id, pickedOptionId);

      if (!isLast) {
        setIdx((i) => i + 1);
        setPickedOptionId(null);
        setSubmitting(false);
        return;
      }

      const finished = await quizService.finishSession(session.id);
      setLastFinishedSession(finished);

      router.replace({
        pathname: '/quiz-results',
        params: {
          score: String(finished.score),
          total: String(finished.total_questions),
        },
      });
    } catch (error) {
      Alert.alert('Erreur', getApiErrorMessage(error));
      setSubmitting(false);
    }
  };

  if (loading || !session || !q) {
    return (
      <View style={[styles.container, styles.centered]}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loaderText}>Préparation du quiz…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={[styles.topBar, { paddingTop: insets.top + 14 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeBtn}
          activeOpacity={0.7}
        >
          <X size={20} color="#fff" strokeWidth={2.4} />
        </TouchableOpacity>

        <View style={styles.progressContainer}>
          <View style={[styles.progressFill, { width: `${((idx + 1) / total) * 100}%` }]} />
        </View>

        <Text style={styles.progressText}>{idx + 1}/{total}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.questionHeader}>
          <Text style={styles.contextText}>{subjectLabel}</Text>
          <Text style={styles.questionText}>{q.statement}</Text>
        </View>

        <View style={styles.optionsContainer}>
          {q.options.map((opt, i) => {
            const isPicked = pickedOptionId === opt.id;

            return (
              <TouchableOpacity
                key={opt.id}
                onPress={() => handlePick(opt.id)}
                disabled={submitting}
                activeOpacity={0.8}
                style={[styles.optCard, isPicked && styles.optCardPicked]}
              >
                <View style={[styles.optIconWrap, isPicked && styles.optIconWrapPicked]}>
                  <Text style={[styles.optIconText, isPicked && styles.optIconTextWhite]}>
                    {String.fromCharCode(65 + i)}
                  </Text>
                </View>
                <Text style={[styles.optText, isPicked && styles.optTextPicked]}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) + 16 }]}>
        <TouchableOpacity
          style={[styles.nextBtn, (pickedOptionId === null || submitting) && styles.nextBtnDisabled]}
          onPress={handleNext}
          activeOpacity={0.85}
          disabled={pickedOptionId === null || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.nextBtnText}>
              {isLast ? 'Voir mon score' : 'Question suivante'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8A090',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    color: '#fff',
    marginTop: 10,
    fontFamily: 'Poppins_500Medium',
  },
  topBar: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingBottom: 16,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  progressText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
  },
  questionHeader: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  contextText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  questionText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 19,
    color: '#fff',
    lineHeight: 26,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 10,
  },
  optCard: {
    minHeight: 60,
    borderRadius: 16,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  optCardPicked: {
    backgroundColor: '#1A2027',
    borderColor: '#1A2027',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 6,
  },
  optIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optIconWrapPicked: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  optIconText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
    color: '#5A6470',
  },
  optIconTextWhite: {
    color: '#fff',
  },
  optText: {
    flex: 1,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: '#1A2027',
  },
  optTextPicked: {
    color: '#fff',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  nextBtn: {
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1A2027',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnDisabled: {
    opacity: 0.4,
  },
  nextBtnText: {
    fontFamily: Platform.OS === 'ios' ? 'Poppins_600SemiBold' : 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#fff',
  },
});
