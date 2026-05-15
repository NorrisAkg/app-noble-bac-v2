import apiClient from "./apiClient";
import type { ApiResponse, Book } from "@/types/api";

export interface BookFilters {
  search?: string;
  subject_id?: number;
  page?: number;
  per_page?: number;
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
   * POST /api/v1/courses/books/{bookId}/signed-url
   */
  getBookSignedUrl: async (bookId: number): Promise<string> => {
    const response = await apiClient.post<ApiResponse<{ url: string }>>(`/courses/books/${bookId}/signed-url`);
    return response.data.data.url;
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
