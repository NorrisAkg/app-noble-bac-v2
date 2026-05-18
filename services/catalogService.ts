import apiClient from './apiClient';
import type {
  ApiResponse,
  Book,
  ExamDetail,
  ExamFilters,
  ExamListItem,
  ExamSignedUrl,
  ExamVideoItem,
} from '@/types/api';

export interface BookFilters {
  search?: string;
  subject_id?: number;
  page?: number;
  per_page?: number;
}

export interface BookDownload {
  url: string;
  expires_at: string;
  expires_in_seconds: number;
  file_name: string;
}

export const catalogService = {
  /**
   * GET /api/v1/courses/books
   */
  getBooks: async (filters: BookFilters = {}): Promise<ApiResponse<Book[]>> => {
    const response = await apiClient.get<ApiResponse<Book[]>>('/courses/books', {
      params: filters,
    });
    return response.data;
  },

  /**
   * GET /api/v1/courses/books/{bookId}/download
   * Premium-only (Gate `download` côté backend). Renvoie une URL signée R2 (TTL 2h).
   */
  downloadBook: async (bookId: number): Promise<BookDownload> => {
    const response = await apiClient.get<ApiResponse<BookDownload>>(
      `/courses/books/${bookId}/download`,
    );
    return response.data.data;
  },

  /**
   * GET /api/v1/catalog
   * Liste paginée des annales BAC. Filtres : country_id / series_id / subject_id / year.
   */
  getExams: async (filters: ExamFilters = {}): Promise<ApiResponse<ExamListItem[]>> => {
    const response = await apiClient.get<ApiResponse<ExamListItem[]>>('/catalog', {
      params: filters,
    });
    return response.data;
  },

  /**
   * GET /api/v1/catalog/{examId}
   * Detail d'une epreuve + flags has_exam_pdf / has_corrige_pdf.
   */
  getExamDetail: async (examId: number): Promise<ExamDetail> => {
    const response = await apiClient.get<ApiResponse<ExamDetail>>(`/catalog/${examId}`);
    return response.data.data;
  },

  /**
   * POST /api/v1/catalog/{examId}/signed-url
   * URL signee R2 du PDF de l'epreuve. TTL 15min (Constants::SIGNED_URL_READ_TTL).
   * Autorise via ExamPolicy::view (public si exam est `published`).
   */
  getExamSignedUrl: async (examId: number): Promise<ExamSignedUrl> => {
    const response = await apiClient.post<ApiResponse<ExamSignedUrl>>(
      `/catalog/${examId}/signed-url`,
    );
    return response.data.data;
  },

  /**
   * POST /api/v1/catalog/{examId}/corrige/signed-url
   * URL signee du corrige. Autorise via ExamPolicy::viewCorrige
   * (Premium scope (country, series) requis). 403 sinon.
   */
  getCorrigeSignedUrl: async (examId: number): Promise<ExamSignedUrl> => {
    const response = await apiClient.post<ApiResponse<ExamSignedUrl>>(
      `/catalog/${examId}/corrige/signed-url`,
    );
    return response.data.data;
  },

  /**
   * GET /api/v1/catalog/{examId}/videos
   * Liste des videos commentees (YouTube) attachees a l'epreuve.
   * Autorise via ExamPolicy::view.
   */
  getExamVideos: async (examId: number): Promise<ExamVideoItem[]> => {
    const response = await apiClient.get<ApiResponse<ExamVideoItem[]>>(
      `/catalog/${examId}/videos`,
    );
    return response.data.data;
  },
};
