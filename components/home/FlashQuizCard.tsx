import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';
import { Zap } from 'lucide-react-native';
import { useMutation } from '@tanstack/react-query';
import { quizService } from '@/services/quizService';
import type { DailyQuiz, DailyQuizAnswerResult } from '@/services/quizService';

interface Props {
  quiz: DailyQuiz;
  /** Appelé une fois la réponse enregistrée — sert à persister le « vu aujourd'hui ». */
  onAnswered: () => void;
}

/** Délai d'affichage de la correction avant le fondu de sortie. */
const DISMISS_DELAY_MS = 3000;

/**
 * Bloc « Quiz éclair du jour » de l'accueil (cf. maquette home-v2).
 * Une seule question, gratuite pour tous, réponse unique : la correction
 * est demandée au backend (anti-triche, is_correct jamais embarqué).
 */
export const FlashQuizCard: React.FC<Props> = ({ quiz, onAnswered }) => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [result, setResult] = useState<DailyQuizAnswerResult | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const answerMutation = useMutation({
    mutationFn: quizService.answerDailyQuiz,
    onSuccess: (res) => {
      setResult(res);
      onAnswered();
    },
    onError: () => setSelectedId(null),
  });

  const answered = result !== null;

  // Une fois répondu : on laisse voir la correction, puis le bloc s'efface.
  useEffect(() => {
    if (!answered) {
      return;
    }
    const timer = setTimeout(() => setDismissed(true), DISMISS_DELAY_MS);
    return () => clearTimeout(timer);
  }, [answered]);

  const handlePress = (optionId: number) => {
    if (answered || answerMutation.isPending) {
      return;
    }
    setSelectedId(optionId);
    answerMutation.mutate(optionId);
  };

  const correctLabel = result
    ? quiz.question.options.find((o) => o.id === result.correct_option_id)?.label
    : null;

  const feedback = result
    ? result.is_correct
      ? (result.explanation ?? 'Bravo ! Reviens demain pour une nouvelle question.')
      : (result.explanation ?? `La bonne réponse était ${correctLabel ?? '—'}. À demain !`)
    : null;

  const optionStyle = (optionId: number) => {
    if (!answered) {
      return [styles.option, selectedId === optionId && styles.optionPending];
    }
    if (optionId === result.correct_option_id) {
      return [styles.option, styles.optionOk];
    }
    if (optionId === selectedId) {
      return [styles.option, styles.optionKo];
    }
    return [styles.option];
  };

  const optionTextStyle = (optionId: number) => {
    if (!answered) {
      return styles.optionText;
    }
    if (optionId === result.correct_option_id) {
      return [styles.optionText, styles.optionTextOk];
    }
    if (optionId === selectedId) {
      return [styles.optionText, styles.optionTextKo];
    }
    return styles.optionText;
  };

  if (dismissed) {
    return null;
  }

  return (
    <Animated.View style={styles.card} exiting={FadeOut.duration(400)}>
      <View style={styles.head}>
        <View style={styles.badgeIcon}>
          <Zap size={14} color="#3DBE45" strokeWidth={2} />
        </View>
        <Text style={styles.title}>Quiz éclair du jour</Text>
        <View style={styles.freePill}>
          <Text style={styles.freePillText}>Gratuit</Text>
        </View>
      </View>

      <Text style={styles.question}>{quiz.question.statement}</Text>

      <View style={styles.options}>
        {quiz.question.options.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={optionStyle(option.id)}
            onPress={() => handlePress(option.id)}
            disabled={answered || answerMutation.isPending}
            activeOpacity={0.8}
          >
            <Text style={optionTextStyle(option.id)} numberOfLines={2}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {feedback && (
        <Text
          style={[
            styles.feedback,
            { color: result?.is_correct ? '#2EA037' : '#D38576' },
          ]}
        >
          {feedback}
        </Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E6E8EB',
    shadowColor: '#1A2027',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  badgeIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#EAF7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13.5,
    color: '#1A2027',
    flex: 1,
  },
  freePill: {
    backgroundColor: '#EAF7EB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  freePillText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10.5,
    color: '#3DBE45',
  },
  question: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13.5,
    color: '#5A6470',
    lineHeight: 19,
    marginTop: 8,
    marginBottom: 12,
    marginHorizontal: 2,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    width: '48.5%',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E6E8EB',
    backgroundColor: '#fff',
  },
  optionPending: {
    borderColor: '#9AA3AC',
  },
  optionOk: {
    backgroundColor: '#EAF7EB',
    borderColor: '#3DBE45',
  },
  optionKo: {
    backgroundColor: '#FBEDE8',
    borderColor: '#E8A090',
  },
  optionText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13.5,
    color: '#1A2027',
  },
  optionTextOk: {
    color: '#2EA037',
  },
  optionTextKo: {
    color: '#D38576',
  },
  feedback: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 12,
    marginHorizontal: 2,
  },
});
