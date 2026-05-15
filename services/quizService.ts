import apiClient from "./apiClient";
import type { ApiResponse, Subject } from "@/types/api";

export interface QuizQuestion {
  id: number;
  content: string;
  difficulty: string;
  answer_options: QuizOption[];
}

export interface QuizOption {
  id: number;
  content: string;
  is_correct?: boolean; // May be hidden in some responses
}

export interface QuizSession {
  id: number;
  status: string;
  correct_count: number;
  score_percentage: number;
  finished_at: string | null;
}

export interface StartQuizResponse {
  session: QuizSession;
  questions: QuizQuestion[];
}

export const quizService = {
  /**
   * GET /api/v1/quiz/{subjectId}/chapters
   */
  getQuizChapters: async (subjectId: number) => {
    const response = await apiClient.get(`/quiz/${subjectId}/chapters`);
    return response.data.data;
  },

  /**
   * POST /api/v1/quiz/sessions
   */
  startSession: async (quizChapterId: number): Promise<StartQuizResponse> => {
    const response = await apiClient.post<ApiResponse<StartQuizResponse>>("/quiz/sessions", {
      quiz_chapter_id: quizChapterId,
    });
    return response.data.data;
  },

  /**
   * POST /api/v1/quiz/sessions/{sessionId}/answers/bulk
   */
  submitBulkAnswers: async (
    sessionId: number,
    answers: { question_id: number; answer_option_id: number | null }[]
  ): Promise<void> => {
    await apiClient.post(`/quiz/sessions/${sessionId}/answers/bulk`, {
      answers,
    });
  },

  /**
   * POST /api/v1/quiz/sessions/{sessionId}/finish
   */
  finishSession: async (sessionId: number): Promise<QuizSession> => {
    const response = await apiClient.post<ApiResponse<QuizSession>>(`/quiz/sessions/${sessionId}/finish`);
    return response.data.data;
  },

  /**
   * GET /api/v1/quiz/history
   */
  getHistory: async (): Promise<QuizSession[]> => {
    const response = await apiClient.get<ApiResponse<QuizSession[]>>("/quiz/history");
    return response.data.data;
  },
};
