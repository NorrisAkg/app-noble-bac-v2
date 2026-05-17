import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Check, X, Info } from 'lucide-react-native';
import { useQuizStore } from '@/store/useQuizStore';

export default function QuizReviewScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const lastFinishedSession = useQuizStore((s) => s.lastFinishedSession);

  if (!lastFinishedSession) {
    return (
      <View style={styles.emptyContainer}>
        <Text>Aucune session trouvée.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: '#3DBE45', marginTop: 10 }}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { score, total_questions: total, questions } = lastFinishedSession;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={{ height: insets.top, backgroundColor: '#3DBE45' }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color="#fff" size={24} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Détail du Quiz</Text>
          <Text style={styles.headerSub}>{score}/{total} points · {percentage}%</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        {questions.map((q, qIdx) => {
          const isCorrect = q.user_answer.is_correct;

          return (
            <View key={q.question_id} style={styles.questionCard}>
              <View style={styles.questionNumContainer}>
                <Text style={styles.questionNum}>QUESTION {qIdx + 1}</Text>
                {isCorrect ? (
                  <View style={styles.badgeCorrect}>
                    <Check size={12} color="#fff" strokeWidth={3} />
                    <Text style={styles.badgeText}>CORRECT</Text>
                  </View>
                ) : (
                  <View style={styles.badgeWrong}>
                    <X size={12} color="#fff" strokeWidth={3} />
                    <Text style={styles.badgeText}>INCORRECT</Text>
                  </View>
                )}
              </View>

              <Text style={styles.questionText}>{q.statement}</Text>

              <View style={styles.optionsList}>
                {q.options.map((opt, oIdx) => {
                  const isUserPick = opt.is_selected;

                  let optStyle: any = styles.option;
                  let optTextStyle: any = styles.optionText;

                  if (opt.is_correct) {
                    optStyle = [styles.option, styles.optionCorrect];
                    optTextStyle = [styles.optionText, styles.optionTextCorrect];
                  } else if (isUserPick) {
                    optStyle = [styles.option, styles.optionWrong];
                    optTextStyle = [styles.optionText, styles.optionTextWrong];
                  }

                  return (
                    <View key={opt.id} style={optStyle}>
                      <View
                        style={[
                          styles.optionLetter,
                          opt.is_correct && styles.letterCorrect,
                          isUserPick && !opt.is_correct && styles.letterWrong,
                        ]}
                      >
                        <Text
                          style={[
                            styles.letterText,
                            (opt.is_correct || isUserPick) && styles.letterTextWhite,
                          ]}
                        >
                          {String.fromCharCode(65 + oIdx)}
                        </Text>
                      </View>
                      <Text style={optTextStyle}>{opt.label}</Text>
                      {opt.is_correct && <Check size={16} color="#3DBE45" />}
                      {isUserPick && !opt.is_correct && <X size={16} color="#E14B36" />}
                    </View>
                  );
                })}
              </View>

              {q.explanation && (
                <View style={styles.explanationBox}>
                  <View style={styles.explHeader}>
                    <Info size={14} color="#5A6470" />
                    <Text style={styles.explTitle}>Explication</Text>
                  </View>
                  <Text style={styles.explText}>{q.explanation}</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    height: 70,
    backgroundColor: '#3DBE45',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: '#fff',
  },
  headerSub: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#1A2027',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  questionNumContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionNum: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
    color: '#9AA3AC',
    letterSpacing: 1,
  },
  badgeCorrect: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3DBE45',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  badgeWrong: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E14B36',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  badgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 9,
    color: '#fff',
  },
  questionText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: '#1A2027',
    lineHeight: 22,
    marginBottom: 20,
  },
  optionsList: {
    gap: 8,
    marginBottom: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 10,
  },
  optionCorrect: {
    backgroundColor: '#EAF7EB',
    borderColor: '#3DBE45',
  },
  optionWrong: {
    backgroundColor: '#FBEDE8',
    borderColor: '#E14B36',
  },
  optionLetter: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#E5E9EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterCorrect: {
    backgroundColor: '#3DBE45',
  },
  letterWrong: {
    backgroundColor: '#E14B36',
  },
  letterText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
    color: '#5A6470',
  },
  letterTextWhite: {
    color: '#fff',
  },
  optionText: {
    flex: 1,
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: '#5A6470',
  },
  optionTextCorrect: {
    color: '#1D6B23',
    fontFamily: 'Poppins_600SemiBold',
  },
  optionTextWrong: {
    color: '#A93122',
    fontFamily: 'Poppins_600SemiBold',
  },
  explanationBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
  },
  explHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  explTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
    color: '#5A6470',
    textTransform: 'uppercase',
  },
  explText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12.5,
    color: '#5A6470',
    lineHeight: 18,
  },
});
