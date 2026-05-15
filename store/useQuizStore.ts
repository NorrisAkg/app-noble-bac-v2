import { create } from 'zustand';

interface QuizQuestion {
  q: string;
  options: string[];
  correct: number;
  expl: string;
}

interface QuizResult {
  question: QuizQuestion;
  userAnswer: number | null;
}

interface QuizState {
  lastSession: {
    questions: QuizQuestion[];
    userAnswers: (number | null)[];
    score: number;
    total: number;
  } | null;
  setLastSession: (questions: QuizQuestion[], userAnswers: (number | null)[], score: number) => void;
  clearSession: () => void;
}

export const useQuizStore = create<QuizState>((set) => ({
  lastSession: null,
  setLastSession: (questions, userAnswers, score) => set({
    lastSession: {
      questions,
      userAnswers,
      score,
      total: questions.length
    }
  }),
  clearSession: () => set({ lastSession: null }),
}));
