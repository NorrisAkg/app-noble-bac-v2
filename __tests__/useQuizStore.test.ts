import { useQuizStore } from '../store/useQuizStore';
import type { QuizSessionFinished } from '../services/quizService';

const sessionFixture: QuizSessionFinished = {
  id: 42,
  subject: { id: 1, name: 'Mathématiques' },
  status: 'completed',
  score: 7,
  total_questions: 10,
  percentage: 70,
  started_at: '2026-05-18T10:00:00Z',
  completed_at: '2026-05-18T10:04:00Z',
  duration_seconds: 240,
  questions: [],
};

describe('useQuizStore', () => {
  beforeEach(() => {
    useQuizStore.setState({ lastFinishedSession: null });
  });

  it('setLastFinishedSession stocke la session', () => {
    useQuizStore.getState().setLastFinishedSession(sessionFixture);
    expect(useQuizStore.getState().lastFinishedSession?.id).toBe(42);
    expect(useQuizStore.getState().lastFinishedSession?.percentage).toBe(70);
  });

  it('clearSession reset a null', () => {
    useQuizStore.setState({ lastFinishedSession: sessionFixture });
    useQuizStore.getState().clearSession();
    expect(useQuizStore.getState().lastFinishedSession).toBeNull();
  });
});
