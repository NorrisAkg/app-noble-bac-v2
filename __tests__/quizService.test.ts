import { quizService } from '../services/quizService';
import apiClient from '../services/apiClient';

jest.mock('../services/apiClient');

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('quizService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should start a session and return questions', async () => {
    const mockResponse = {
      data: {
        data: {
          session: { id: 1, status: 'in_progress' },
          questions: [{ id: 101, content: 'Test Question' }],
        },
      },
    };

    mockedApiClient.post.mockResolvedValueOnce(mockResponse);

    const result = await quizService.startSession(5);

    expect(mockedApiClient.post).toHaveBeenCalledWith('/quiz/sessions', {
      quiz_chapter_id: 5,
    });
    expect(result.session.id).toBe(1);
    expect(result.questions[0].content).toBe('Test Question');
  });

  it('should submit bulk answers', async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: {} });

    const answers = [
      { question_id: 101, answer_option_id: 201 },
    ];

    await quizService.submitBulkAnswers(1, answers);

    expect(mockedApiClient.post).toHaveBeenCalledWith('/quiz/sessions/1/answers/bulk', {
      answers,
    });
  });
});
