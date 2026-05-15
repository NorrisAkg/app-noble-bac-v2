import apiClient from "./apiClient";
import type { ApiResponse, Subject, Chapter, Lesson } from "@/types/api";

export const courseService = {
  /**
   * GET /api/v1/courses/subjects
   */
  getSubjects: async (): Promise<Subject[]> => {
    const response = await apiClient.get<ApiResponse<Subject[]>>("/courses/subjects");
    return response.data.data;
  },

  /**
   * GET /api/v1/courses/subjects/{subjectSlug}/chapters
   */
  getChapters: async (subjectSlug: string): Promise<Chapter[]> => {
    const response = await apiClient.get<ApiResponse<Chapter[]>>(`/courses/subjects/${subjectSlug}/chapters`);
    return response.data.data;
  },

  /**
   * GET /api/v1/courses/chapters/{chapterId}/lessons
   */
  getLessons: async (chapterId: number): Promise<Lesson[]> => {
    const response = await apiClient.get<ApiResponse<Lesson[]>>(`/courses/chapters/${chapterId}/lessons`);
    return response.data.data;
  },

  /**
   * GET /api/v1/courses/lessons/{lessonId}
   */
  getLesson: async (lessonId: number): Promise<Lesson> => {
    const response = await apiClient.get<ApiResponse<Lesson>>(`/courses/lessons/${lessonId}`);
    return response.data.data;
  },
};
