import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { X, Check } from 'lucide-react-native';
import Animated, { FadeInUp, SlideInDown } from 'react-native-reanimated';

import { quizService, QuizQuestion, QuizSession } from '@/services/quizService';
import { useQuizStore } from '@/store/useQuizStore';

export default function QuizSessionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { subjectId, subjectLabel = 'Quiz' } = useLocalSearchParams();

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [session, setSession] = useState<QuizSession | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [showExpl, setShowExpl] = useState(false);
  const [score, setScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{question_id: number, answer_option_id: number | null}[]>([]);

  const setLastSession = useQuizStore((s) => s.setLastSession);

  useEffect(() => {
    initQuiz();
  }, []);

  const initQuiz = async () => {
    try {
      const chapters = await quizService.getQuizChapters(Number(subjectId));
      if (chapters.length === 0) {
        alert("Aucun quiz disponible pour cette matière.");
        router.back();
        return;
      }

      const data = await quizService.startSession(chapters[0].id);
      setSession(data.session);
      setQuestions(data.questions);
      setUserAnswers(new Array(data.questions.length).fill(null));
    } catch (error) {
      console.error("Quiz init error:", error);
      alert("Erreur lors du chargement du quiz.");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const total = questions.length;
  const q = questions[idx];

  const handlePick = (optionIdx: number) => {
    if (picked !== null) return;
    setPicked(optionIdx);
    
    const selectedOption = q.answer_options[optionIdx];
    
    const newAnswers = [...userAnswers];
    newAnswers[idx] = {
      question_id: q.id,
      answer_option_id: selectedOption.id
    };
    setUserAnswers(newAnswers);

    if (selectedOption.is_correct) {
      setScore((s) => s + 1);
    }
    
    setTimeout(() => {
      setShowExpl(true);
    }, 600);
  };

  const handleNext = async () => {
    if (idx < total - 1) {
      setIdx(idx + 1);
      setPicked(null);
      setShowExpl(false);
    } else {
      setLoading(true);
      try {
        if (session) {
          await quizService.submitBulkAnswers(session.id, userAnswers);
          const finalSession = await quizService.finishSession(session.id);
          
          setLastSession([], [], score); 
          
          router.push({
            pathname: '/quiz-results',
            params: { 
              score: finalSession.correct_count.toString(), 
              total: total.toString() 
            },
          });
        }
      } catch (error) {
        console.error("Finish quiz error:", error);
        alert("Erreur lors de l'enregistrement des résultats.");
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading && !session) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loaderText}>Préparation du quiz...</Text>
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
          <Text style={styles.contextText}>
            {subjectLabel}
          </Text>
          <Text style={styles.questionText}>
            {q.content}
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          {q.answer_options.map((opt, i) => {
            const isPicked = picked === i;
            const isCorrect = picked !== null && opt.is_correct;
            const isWrongPick = isPicked && !opt.is_correct;

            let cardStyle = styles.optCard;
            let textStyle = styles.optText;
            let iconWrapStyle = styles.optIconWrap;
            let iconTextStyle = styles.optIconText;

            if (isCorrect) {
              cardStyle = styles.optCardCorrect;
              textStyle = styles.optTextWhite;
              iconWrapStyle = styles.optIconWrapTranslucent;
              iconTextStyle = styles.optIconTextWhite;
            } else if (isWrongPick) {
              cardStyle = styles.optCardWrong;
              textStyle = styles.optTextWhite;
              iconWrapStyle = styles.optIconWrapTranslucent;
              iconTextStyle = styles.optIconTextWhite;
            }

            return (
              <TouchableOpacity
                key={opt.id}
                onPress={() => handlePick(i)}
                disabled={picked !== null}
                activeOpacity={0.8}
                style={[
                  cardStyle,
                  isPicked && picked === null && styles.optCardShadow
                ]}
              >
                <View style={iconWrapStyle}>
                  {isCorrect ? (
                    <Check size={16} color="#fff" strokeWidth={3} />
                  ) : isWrongPick ? (
                    <X size={16} color="#fff" strokeWidth={3} />
                  ) : (
                    <Text style={iconTextStyle}>{String.fromCharCode(65 + i)}</Text>
                  )}
                </View>
                <Text style={textStyle}>{opt.content}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {showExpl && (
        <Animated.View 
          entering={SlideInDown.duration(280)} 
          style={[styles.drawer, { paddingBottom: Math.max(insets.bottom, 20) + 16 }]}
        >
          <View style={styles.drawerHeader}>
            <View style={[styles.drawerIcon, q.answer_options[picked!].is_correct ? styles.drawerIconCorrect : styles.drawerIconWrong]}>
              {q.answer_options[picked!].is_correct ? (
                <Check size={14} color="#3DBE45" strokeWidth={3} />
              ) : (
                <Text style={styles.drawerIconWrongText}>!</Text>
              )}
            </View>
            <Text style={[styles.drawerTitle, q.answer_options[picked!].is_correct ? styles.drawerTitleCorrect : styles.drawerTitleWrong]}>
              {q.answer_options[picked!].is_correct ? 'Bonne réponse !' : 'Pas tout à fait'}
            </Text>
          </View>
          
          <Text style={styles.explText}>
            {q.answer_options[picked!].explanation || "Pas d'explication disponible."}
          </Text>

          <TouchableOpacity 
            style={[styles.nextBtn, loading && { opacity: 0.7 }]} 
            onPress={handleNext} 
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.nextBtnText}>
                {idx === total - 1 ? 'Voir mon score' : 'Question suivante'}
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
    paddingBottom: 100, // Space for drawer
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
  optCardShadow: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 6,
  },
  optCardCorrect: {
    minHeight: 60,
    borderRadius: 16,
    backgroundColor: '#3DBE45',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  optCardWrong: {
    minHeight: 60,
    borderRadius: 16,
    backgroundColor: '#E14B36',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  optIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optIconWrapTranslucent: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optIconText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
    color: '#5A6470',
  },
  optIconTextWhite: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
    color: '#fff',
  },
  optText: {
    flex: 1,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: '#1A2027',
  },
  optTextWhite: {
    flex: 1,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
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
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  drawerIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerIconCorrect: {
    backgroundColor: '#EAF7EB',
  },
  drawerIconWrong: {
    backgroundColor: '#FBEDE8',
  },
  drawerIconWrongText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: '#D38576',
    marginTop: Platform.OS === 'ios' ? 2 : 0,
  },
  drawerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
  },
  drawerTitleCorrect: {
    color: '#3DBE45',
  },
  drawerTitleWrong: {
    color: '#D38576',
  },
  explText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13.5,
    color: '#5A6470',
    lineHeight: 20,
    marginBottom: 20,
  },
  nextBtn: {
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1A2027',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#fff',
  },
});
