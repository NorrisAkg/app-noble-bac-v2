import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { X, Check, AlertCircle } from 'lucide-react-native';

import { quizService } from '@/services/quizService';
import type { QuizSession, QuizSessionQuestion } from '@/services/quizService';
import { useQuizStore } from '@/store/useQuizStore';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { getApiErrorMessage } from '@/utils/apiError';
import { C } from '@/constants/theme';

type PendingAnswer = { questionId: number; optionId: number };

type AnswerResult = {
  isCorrect: boolean;
  correctOptionId: number | null;
  explanation: string | null;
};

export default function QuizSessionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { chapterId, subjectLabel = 'Quiz', chapterTitle } = useLocalSearchParams<{
    chapterId: string;
    subjectLabel?: string;
    chapterTitle?: string;
  }>();

  const [session, setSession] = useState<QuizSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [idx, setIdx] = useState(0);
  const [pickedOptionId, setPickedOptionId] = useState<number | null>(null);
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);

  const drawerAnim = useRef(new Animated.Value(300)).current;
  const [drawerVisible, setDrawerVisible] = useState(false);
  const drawerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isOnline = useOnlineStatus();
  const pendingAnswers = useRef<PendingAnswer[]>([]);

  const setLastFinishedSession = useQuizStore((s) => s.setLastFinishedSession);

  useEffect(() => {
    if (!chapterId) {
      Alert.alert('Erreur', 'Chapitre introuvable.');
      router.back();
      return;
    }
    (async () => {
      try {
        const data = await quizService.startSession(Number(chapterId));
        setSession(data);
      } catch (error) {
        Alert.alert('Quiz indisponible', getApiErrorMessage(error));
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [chapterId, router]);

  useEffect(() => {
    return () => {
      if (drawerTimerRef.current) clearTimeout(drawerTimerRef.current);
    };
  }, []);

  const questions: QuizSessionQuestion[] = session?.questions ?? [];
  const total = questions.length;
  const q = questions[idx];
  const isLast = idx === total - 1;
  const answered = answerResult !== null;

  const showDrawer = () => {
    setDrawerVisible(true);
    Animated.timing(drawerAnim, {
      toValue: 0,
      duration: 280,
      useNativeDriver: true,
    }).start();
  };

  const hideDrawer = (cb: () => void) => {
    Animated.timing(drawerAnim, {
      toValue: 300,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setDrawerVisible(false);
      cb();
    });
  };

  const handlePick = async (optionId: number) => {
    if (answered || submitting) return;
    setPickedOptionId(optionId);

    if (isOnline) {
      setSubmitting(true);
      try {
        if (!isLast) {
          const progress = await quizService.submitAnswer(session!.id, q.id, optionId);
          setAnswerResult({
            isCorrect: progress.is_correct,
            correctOptionId: progress.correct_option_id,
            explanation: progress.explanation,
          });
        } else {
          // Last question: submit + finish after drawer interaction
          const progress = await quizService.submitAnswer(session!.id, q.id, optionId);
          setAnswerResult({
            isCorrect: progress.is_correct,
            correctOptionId: progress.correct_option_id,
            explanation: progress.explanation,
          });
        }
      } catch (error) {
        Alert.alert('Erreur', getApiErrorMessage(error));
        setPickedOptionId(null);
        setSubmitting(false);
        return;
      }
      setSubmitting(false);
    } else {
      pendingAnswers.current.push({ questionId: q.id, optionId });
      // Offline: no feedback available
      setAnswerResult({ isCorrect: false, correctOptionId: null, explanation: null });
    }

    drawerTimerRef.current = setTimeout(showDrawer, 600);
  };

  const handleNext = async () => {
    if (!isLast) {
      hideDrawer(() => {
        setIdx((i) => i + 1);
        setPickedOptionId(null);
        setAnswerResult(null);
        drawerAnim.setValue(300);
      });
      return;
    }

    // Last question — finish session
    if (!isOnline && pendingAnswers.current.length > 0) {
      Alert.alert('Connexion requise', 'Reconnecte-toi pour soumettre ton quiz.');
      return;
    }

    setSubmitting(true);
    try {
      for (const { questionId, optionId } of pendingAnswers.current) {
        await quizService.submitAnswer(session!.id, questionId, optionId);
      }
      pendingAnswers.current = [];

      const finished = await quizService.finishSession(session!.id);
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

  const progressPct = ((idx + 1) / total) * 100;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 14 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} activeOpacity={0.7}>
          <X size={20} color="#fff" strokeWidth={2.4} />
        </TouchableOpacity>

        <View style={styles.progressContainer}>
          <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
        </View>

        <Text style={styles.progressText}>{idx + 1}/{total}</Text>
      </View>

      {/* Question + options */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.questionText}>{q.statement}</Text>

        <View style={styles.optionsCard}>
          {q.options.map((opt, i) => {
            const isPicked = pickedOptionId === opt.id;
            const isOffline = answered && answerResult?.correctOptionId === null;
            const isCorrectOpt = !isOffline && answered && answerResult?.correctOptionId === opt.id;
            const isWrongPick = !isOffline && answered && isPicked && !answerResult?.isCorrect;
            const isOfflinePick = isOffline && isPicked;

            const showCheck = isCorrectOpt;
            const showCross = isWrongPick;
            const isWhiteText = isCorrectOpt || isWrongPick || isOfflinePick;
            const isNotLastOpt = i < q.options.length - 1;

            return (
              <TouchableOpacity
                key={opt.id}
                onPress={() => handlePick(opt.id)}
                disabled={answered || submitting}
                activeOpacity={0.75}
                style={[
                  styles.optRow,
                  isNotLastOpt && styles.optBorder,
                  isCorrectOpt && styles.optCorrect,
                  isWrongPick && styles.optWrong,
                  isOfflinePick && styles.optOffline,
                ]}
              >
                {showCheck && <Check size={18} color="#fff" strokeWidth={2.6} style={styles.optIcon} />}
                {showCross && <X size={18} color="#fff" strokeWidth={2.6} style={styles.optIcon} />}
                {!showCheck && !showCross && <View style={styles.optIconPlaceholder} />}
                <Text style={[styles.optText, isWhiteText && styles.optTextWhite]}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Explanation drawer */}
      {drawerVisible && (
        <Animated.View
          style={[
            styles.drawer,
            { paddingBottom: Math.max(insets.bottom, 20) + 16, transform: [{ translateY: drawerAnim }] },
          ]}
        >
          {answerResult?.correctOptionId !== null ? (
            <View style={[styles.drawerStatus, answerResult?.isCorrect ? styles.drawerStatusCorrect : styles.drawerStatusWrong]}>
              {answerResult?.isCorrect ? (
                <Check size={16} color={C.green} strokeWidth={2.6} />
              ) : (
                <AlertCircle size={16} color={C.salmonDark} strokeWidth={2.4} />
              )}
              <Text style={[styles.drawerStatusText, { color: answerResult?.isCorrect ? C.green : C.salmonDark }]}>
                {answerResult?.isCorrect ? 'Bonne réponse !' : 'Pas tout à fait'}
              </Text>
            </View>
          ) : (
            <View style={[styles.drawerStatus, styles.drawerStatusOffline]}>
              <Text style={styles.drawerStatusTextOffline}>Réponse enregistrée</Text>
            </View>
          )}

          {answerResult?.explanation ? (
            <Text style={styles.drawerExplanation}>{answerResult.explanation}</Text>
          ) : null}

          <TouchableOpacity
            style={styles.drawerBtn}
            onPress={handleNext}
            activeOpacity={0.85}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.drawerBtnText}>
                {isLast ? 'Voir mon score' : 'Question suivante'}
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      )}
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
    backgroundColor: '#4F86F7',
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
    paddingTop: 20,
    paddingBottom: 240,
  },
  questionText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 19,
    color: '#fff',
    lineHeight: 27,
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  optionsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  optRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 60,
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 12,
  },
  optBorder: {
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  optBase: {
    backgroundColor: '#fff',
  },
  optCorrect: {
    backgroundColor: C.green,
  },
  optWrong: {
    backgroundColor: '#E14B36',
  },
  optOffline: {
    backgroundColor: C.ink2,
  },
  optIcon: {
    width: 22,
  },
  optIconPlaceholder: {
    width: 22,
  },
  optText: {
    flex: 1,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: C.ink,
  },
  optTextWhite: {
    color: '#fff',
  },
  // Drawer
  drawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  drawerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  drawerStatusCorrect: {
    backgroundColor: C.greenSoft,
  },
  drawerStatusWrong: {
    backgroundColor: C.salmonSoft,
  },
  drawerStatusOffline: {
    backgroundColor: C.bg,
  },
  drawerStatusText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
  },
  drawerStatusTextOffline: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: C.ink2,
  },
  drawerExplanation: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13.5,
    color: C.ink2,
    lineHeight: 20,
    marginBottom: 18,
  },
  drawerBtn: {
    height: 52,
    borderRadius: 26,
    backgroundColor: C.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 6,
  },
  drawerBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: '#fff',
    letterSpacing: 0.2,
  },
});
