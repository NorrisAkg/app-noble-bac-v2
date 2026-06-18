import apiClient from "./apiClient";
import type {
  ApiResponse,
  Subject,
  Chapter,
  CourseSnapshotSubject,
  Lesson,
  RevisionSheet,
  RevisionSheetListItem,
  ChapterVideo,
  ChapterVideoListItem,
} from "@/types/api";

export const courseService = {
  /**
   * GET /api/v1/courses/snapshot
   * Retourne toutes les matières publiées avec chapitres et leçons imbriqués
   * en 3 requêtes SQL. Conçu pour le pré-chargement offline au premier login.
   */
  getSnapshot: async (): Promise<CourseSnapshotSubject[]> => {
    const response = await apiClient.get<ApiResponse<CourseSnapshotSubject[]>>("/courses/snapshot");
    return response.data.data ?? [];
  },

  /**
   * GET /api/v1/courses/subjects
   */
  getSubjects: async (): Promise<Subject[]> => {
    const response = await apiClient.get<ApiResponse<Subject[]>>("/courses/subjects");
    return response.data.data;
  },

  /**
   * GET /api/v1/courses/subjects/{subjectId}/chapters
   * Le backend bind Subject par sa clé primaire (ID, pas slug).
   */
  getChapters: async (subjectId: number): Promise<Chapter[]> => {
    const response = await apiClient.get<ApiResponse<Chapter[]>>(
      `/courses/subjects/${subjectId}/chapters`,
    );
    return response.data.data;
  },

  /**
   * GET /api/v1/quiz/subjects/{subjectId}/chapters
   * Retourne uniquement les chapitres dont le quiz est publié par l'admin (quiz_published = true).
   */
  getQuizChapters: async (subjectId: number): Promise<Chapter[]> => {
    const response = await apiClient.get<ApiResponse<Chapter[]>>(
      `/quiz/subjects/${subjectId}/chapters`,
    );
    return response.data.data;
  },

  /**
   * GET /api/v1/courses/chapters/{chapterId}/lessons
   */
  getLessons: async (chapterId: number): Promise<Lesson[]> => {
    const response = await apiClient.get<ApiResponse<Lesson[]>>(
      `/courses/chapters/${chapterId}/lessons`,
    );
    return response.data.data;
  },

  /**
   * GET /api/v1/courses/lessons/{lessonId}
   */
  getLesson: async (lessonId: number): Promise<Lesson> => {
    const response = await apiClient.get<ApiResponse<Lesson>>(`/courses/lessons/${lessonId}`);
    return response.data.data;
  },

  /**
   * GET /api/v1/courses/chapters/{chapterId}/revision-sheets
   */
  getRevisionSheetsByChapter: async (chapterId: number): Promise<RevisionSheetListItem[]> => {
    const response = await apiClient.get<ApiResponse<RevisionSheetListItem[]>>(
      `/courses/chapters/${chapterId}/revision-sheets`,
    );
    return response.data.data;
  },

  /**
   * GET /api/v1/courses/revision-sheets/{revisionSheetId}
   * Retourne le détail avec une URL signée R2 (TTL 15min côté backend).
   */
  getRevisionSheet: async (revisionSheetId: number): Promise<RevisionSheet> => {
    const response = await apiClient.get<ApiResponse<RevisionSheet>>(
      `/courses/revision-sheets/${revisionSheetId}`,
    );
    return response.data.data;
  },

  /**
   * GET /api/v1/courses/chapters/{chapterId}/chapter-videos
   */
  getChapterVideosByChapter: async (chapterId: number): Promise<ChapterVideoListItem[]> => {
    const response = await apiClient.get<ApiResponse<ChapterVideoListItem[]>>(
      `/courses/chapters/${chapterId}/chapter-videos`,
    );
    return response.data.data;
  },

  /**
   * GET /api/v1/courses/chapter-videos/{chapterVideoId}
   */
  getChapterVideo: async (chapterVideoId: number): Promise<ChapterVideo> => {
    const response = await apiClient.get<ApiResponse<ChapterVideo>>(
      `/courses/chapter-videos/${chapterVideoId}`,
    );
    return response.data.data;
  },
};
