import { catalogService } from '../services/catalogService';
import apiClient from '../services/apiClient';

jest.mock('../services/apiClient');

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('catalogService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getExams GET /catalog avec filtres en query params', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'OK',
        data: [
          {
            id: 1,
            year: { id: 1, value: 2024 },
            session: 'Juin',
            country: { id: 1, name: 'Sénégal', iso_code: 'SN' },
            series: { id: 7, name: 'S2' },
            subject: { id: 3, name: 'Mathématiques', icon_slug: 'math' },
          },
        ],
        meta: { current_page: 1, per_page: 100, total: 1, last_page: 1 },
      },
    });

    const result = await catalogService.getExams({
      subject_id: 3,
      country_id: 1,
      series_id: 7,
      per_page: 100,
    });

    expect(mockedApiClient.get).toHaveBeenCalledWith('/catalog', {
      params: { subject_id: 3, country_id: 1, series_id: 7, per_page: 100 },
    });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].year.value).toBe(2024);
    expect(result.meta?.total).toBe(1);
  });

  it('getExamDetail GET /catalog/{id} et deballe data', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'OK',
        data: {
          id: 42,
          year: { id: 2, value: 2024 },
          session: null,
          country: { id: 1, name: 'CI', iso_code: 'CI' },
          series: { id: 1, name: 'C' },
          subject: { id: 1, name: 'Math', icon_slug: null },
          has_exam_pdf: true,
          has_corrige_pdf: false,
        },
      },
    });

    const result = await catalogService.getExamDetail(42);

    expect(mockedApiClient.get).toHaveBeenCalledWith('/catalog/42');
    expect(result.has_exam_pdf).toBe(true);
    expect(result.has_corrige_pdf).toBe(false);
  });

  it('getExamSignedUrl POST /catalog/{id}/signed-url renvoie url + expires_at', async () => {
    mockedApiClient.post.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'OK',
        data: { url: 'https://r2.example/signed', expires_at: '2026-05-18T17:00:00Z' },
      },
    });

    const result = await catalogService.getExamSignedUrl(7);

    expect(mockedApiClient.post).toHaveBeenCalledWith('/catalog/7/signed-url');
    expect(result.url).toBe('https://r2.example/signed');
  });

  it('getCorrigeSignedUrl POST /catalog/{id}/corrige/signed-url', async () => {
    mockedApiClient.post.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'OK',
        data: { url: 'https://r2.example/corrige', expires_at: '2026-05-18T17:00:00Z' },
      },
    });

    const result = await catalogService.getCorrigeSignedUrl(7);

    expect(mockedApiClient.post).toHaveBeenCalledWith('/catalog/7/corrige/signed-url');
    expect(result.url).toBe('https://r2.example/corrige');
  });

  it('getExamVideos GET /catalog/{id}/videos renvoie la liste', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'OK',
        data: [
          {
            id: 1,
            title: 'Exo 1',
            youtube_video_id: 'abc123',
            duration_sec: 600,
            thumbnail_url: null,
            order: 1,
            status: 'published',
          },
        ],
      },
    });

    const result = await catalogService.getExamVideos(7);

    expect(mockedApiClient.get).toHaveBeenCalledWith('/catalog/7/videos');
    expect(result).toHaveLength(1);
    expect(result[0].youtube_video_id).toBe('abc123');
  });

  it('getBooks et downloadBook restent fonctionnels (pas de regression)', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: { success: true, message: 'OK', data: [] },
    });
    await catalogService.getBooks({ search: 'algebra' });
    expect(mockedApiClient.get).toHaveBeenCalledWith('/courses/books', {
      params: { search: 'algebra' },
    });

    mockedApiClient.get.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'OK',
        data: { url: 'u', expires_at: 'e', expires_in_seconds: 7200, file_name: 'f.pdf' },
      },
    });
    const dl = await catalogService.downloadBook(99);
    expect(mockedApiClient.get).toHaveBeenCalledWith('/courses/books/99/download');
    expect(dl.file_name).toBe('f.pdf');
  });
});
