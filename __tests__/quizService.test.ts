import { quizService } from '../services/quizService';
import apiClient from '../services/apiClient';

jest.mock('../services/apiClient');

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('quizService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('startSession posts chapter_id and returns the session with questions', async () => {
    mockedApiClient.post.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'OK',
        data: {
          id: 1,
          subject_id: 5,
          chapter_id: 11,
          status: 'in_progress',
          total_questions: 1,
          questions_answered: 0,
          started_at: null,
          completed_at: null,
          questions: [
            {
              id: 101,
              statement: 'Test Question',
              question_type: 'mcq',
              difficulty: 'easy',
              options: [{ id: 201, label: 'A' }],
            },
          ],
        },
      },
    });

    const result = await quizService.startSession(11);

    expect(mockedApiClient.post).toHaveBeenCalledWith('/quiz/sessions', { chapter_id: 11 });
    expect(result.id).toBe(1);
    expect(result.questions).toHaveLength(1);
    expect(result.questions[0].statement).toBe('Test Question');
  });

  it('submitAnswer posts a single answer payload', async () => {
    mockedApiClient.post.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'OK',
        data: { questions_answered: 1, questions_remaining: 9 },
      },
    });

    const result = await quizService.submitAnswer(1, 101, 201);

    expect(mockedApiClient.post).toHaveBeenCalledWith('/quiz/sessions/1/answers', {
      question_id: 101,
      selected_option_id: 201,
    });
    expect(result.questions_answered).toBe(1);
    expect(result.questions_remaining).toBe(9);
  });

  it('finishSession posts to the finish endpoint and returns the finished resource', async () => {
    mockedApiClient.post.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'OK',
        data: {
          id: 1,
          subject: { id: 5, name: 'SVT' },
          chapter: { id: 11, title: 'Immunologie' },
          status: 'completed',
          score: 8,
          total_questions: 10,
          percentage: 80,
          started_at: null,
          completed_at: null,
          duration_seconds: 120,
          questions: [],
        },
      },
    });

    const result = await quizService.finishSession(1);

    expect(mockedApiClient.post).toHaveBeenCalledWith('/quiz/sessions/1/finish');
    expect(result.score).toBe(8);
    expect(result.percentage).toBe(80);
  });

  it('getHistory fetches the paginated history endpoint', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'OK',
        data: [],
        meta: { current_page: 1, per_page: 20, total: 0, last_page: 1 },
      },
    });

    const result = await quizService.getHistory();

    expect(mockedApiClient.get).toHaveBeenCalledWith('/quiz/sessions/history', {
      params: { page: 1, per_page: 20 },
    });
    expect(result.data).toEqual([]);
    expect(result.meta?.current_page).toBe(1);
  });

  it('getDailyQuiz returns the planned question for the user series', async () => {
    const daily = {
      id: 'dq-1',
      date: '2026-06-12',
      question: {
        id: 7,
        statement: 'Quelle est la dérivée de f(x) = x² ?',
        question_type: 'mcq_single',
        difficulty: 'easy',
        subject: { id: 3, name: 'Mathématiques' },
        options: [
          { id: 21, label: 'x²', order: 1 },
          { id: 22, label: '2x', order: 2 },
        ],
      },
    };
    mockedApiClient.get.mockResolvedValueOnce({
      data: { success: true, message: 'OK', data: daily },
    });

    const result = await quizService.getDailyQuiz();

    expect(mockedApiClient.get).toHaveBeenCalledWith('/quiz/daily');
    expect(result).toEqual(daily);
  });

  it('getDailyQuiz returns null when nothing is planned today', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: { success: true, message: 'OK', data: null },
    });

    await expect(quizService.getDailyQuiz()).resolves.toBeNull();
  });

  it('answerDailyQuiz posts the option and returns the verdict', async () => {
    mockedApiClient.post.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'OK',
        data: { is_correct: false, correct_option_id: 22, explanation: 'La dérivée de x² est 2x.' },
      },
    });

    const result = await quizService.answerDailyQuiz(21);

    expect(mockedApiClient.post).toHaveBeenCalledWith('/quiz/daily/answer', { option_id: 21 });
    expect(result.is_correct).toBe(false);
    expect(result.correct_option_id).toBe(22);
  });
});
