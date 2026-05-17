import { create } from 'zustand';
import type { QuizSessionFinished } from '@/services/quizService';

interface QuizState {
  lastFinishedSession: QuizSessionFinished | null;
  setLastFinishedSession: (session: QuizSessionFinished) => void;
  clearSession: () => void;
}

export const useQuizStore = create<QuizState>((set) => ({
  lastFinishedSession: null,
  setLastFinishedSession: (session) => set({ lastFinishedSession: session }),
  clearSession: () => set({ lastFinishedSession: null }),
}));
