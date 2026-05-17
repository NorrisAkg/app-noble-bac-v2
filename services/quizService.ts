import apiClient from "./apiClient";
import type { ApiResponse } from "@/types/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export type QuizSessionStatus = "in_progress" | "completed" | "abandoned";

/** Option exposée pendant une session active (sans is_correct). */
export interface QuizSessionOption {
  id: number;
  label: string;
}

/** Question exposée pendant une session active (sans explanation ni is_correct). */
export interface QuizSessionQuestion {
  id: number;
  statement: string;
  question_type: string;
  difficulty: string;
  options: QuizSessionOption[];
}

/** Session active renvoyée par /quiz/sessions (POST) et /quiz/sessions/{id} (GET). */
export interface QuizSession {
  id: number;
  subject_id: number;
  status: QuizSessionStatus;
  total_questions: number;
  questions_answered: number;
  started_at: string | null;
  completed_at: string | null;
  questions: QuizSessionQuestion[];
}

/** Réponse de /quiz/sessions/{id}/answers (POST). */
export interface AnswerProgress {
  questions_answered: number;
  questions_remaining: number;
}

/** Option exposée APRÈS finish (avec correction). */
export interface QuizFinishedOption {
  id: number;
  label: string;
  is_correct: boolean;
  is_selected: boolean;
}

export interface QuizFinishedQuestion {
  question_id: number;
  statement: string;
  explanation: string | null;
  difficulty: string;
  options: QuizFinishedOption[];
  user_answer: {
    selected_option_id: number | null;
    is_correct: boolean;
    answered_at: string | null;
  };
}

/** Session terminée renvoyée par /quiz/sessions/{id}/finish (POST). */
export interface QuizSessionFinished {
  id: number;
  subject: { id: number; name: string };
  status: QuizSessionStatus;
  score: number;
  total_questions: number;
  percentage: number;
  started_at: string | null;
  completed_at: string | null;
  duration_seconds: number | null;
  questions: QuizFinishedQuestion[];
}

/** Item de l'historique paginé. */
export interface QuizSessionHistoryItem {
  id: number;
  subject: { id: number; name: string };
  score: number;
  total_questions: number;
  percentage: number;
  started_at: string | null;
  completed_at: string | null;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const quizService = {
  /**
   * POST /api/v1/quiz/sessions
   * Démarre une session pour une matière. Le backend tire 10 questions aléatoires.
   */
  startSession: async (subjectId: number): Promise<QuizSession> => {
    const response = await apiClient.post<ApiResponse<QuizSession>>("/quiz/sessions", {
      subject_id: subjectId,
    });
    return response.data.data;
  },

  /**
   * GET /api/v1/quiz/sessions/{sessionId}
   * Récupère une session active (avec ses questions).
   */
  getSession: async (sessionId: number): Promise<QuizSession> => {
    const response = await apiClient.get<ApiResponse<QuizSession>>(`/quiz/sessions/${sessionId}`);
    return response.data.data;
  },

  /**
   * POST /api/v1/quiz/sessions/{sessionId}/answers
   * Enregistre UNE réponse à la fois. Le backend ne renvoie pas is_correct
   * pendant la session (anti-triche). La correction est exposée par finishSession.
   */
  submitAnswer: async (
    sessionId: number,
    questionId: number,
    selectedOptionId: number,
  ): Promise<AnswerProgress> => {
    const response = await apiClient.post<ApiResponse<AnswerProgress>>(
      `/quiz/sessions/${sessionId}/answers`,
      { question_id: questionId, selected_option_id: selectedOptionId },
    );
    return response.data.data;
  },

  /**
   * POST /api/v1/quiz/sessions/{sessionId}/finish
   * Clôt la session et renvoie le détail complet (questions + corrections).
   */
  finishSession: async (sessionId: number): Promise<QuizSessionFinished> => {
    const response = await apiClient.post<ApiResponse<QuizSessionFinished>>(
      `/quiz/sessions/${sessionId}/finish`,
    );
    return response.data.data;
  },

  /**
   * GET /api/v1/quiz/sessions/history
   * Historique paginé des sessions terminées de l'utilisateur courant.
   */
  getHistory: async (
    page = 1,
    perPage = 20,
  ): Promise<{ data: QuizSessionHistoryItem[]; meta?: ApiResponse<unknown>["meta"] }> => {
    const response = await apiClient.get<ApiResponse<QuizSessionHistoryItem[]>>(
      "/quiz/sessions/history",
      { params: { page, per_page: perPage } },
    );
    return { data: response.data.data, meta: response.data.meta };
  },
};
