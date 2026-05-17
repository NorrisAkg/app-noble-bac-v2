import apiClient from "./apiClient";
import type { ApiResponse, Book } from "@/types/api";

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
    const response = await apiClient.get<ApiResponse<Book[]>>("/courses/books", {
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
   * (For Annales/Exams)
   */
  getExams: async () => {
    const response = await apiClient.get("/catalog");
    return response.data.data;
  },
};
