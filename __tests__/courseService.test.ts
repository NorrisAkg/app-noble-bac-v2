import { courseService } from '../services/courseService';
import apiClient from '../services/apiClient';

jest.mock('../services/apiClient');

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('courseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getChapters calls /courses/subjects/{id}/chapters with subject id (not slug)', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: { success: true, message: 'OK', data: [{ id: 1, title: 'C1', order: 1, file_count: 0, free_file: null }] },
    });

    const result = await courseService.getChapters(42);

    expect(mockedApiClient.get).toHaveBeenCalledWith('/courses/subjects/42/chapters');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it('getLessons hits /courses/chapters/{id}/lessons', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: { success: true, message: 'OK', data: [] },
    });

    await courseService.getLessons(7);

    expect(mockedApiClient.get).toHaveBeenCalledWith('/courses/chapters/7/lessons');
  });

  it('getLesson hits /courses/lessons/{id} and unwraps data', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'OK',
        data: { id: 1, title: 'Dérivation', order: 1, duration_minutes: 30, is_free: true, status: 'published', content: '<p>x</p>' },
      },
    });

    const lesson = await courseService.getLesson(1);

    expect(mockedApiClient.get).toHaveBeenCalledWith('/courses/lessons/1');
    expect(lesson.title).toBe('Dérivation');
    expect(lesson.content).toBe('<p>x</p>');
  });

  it('getRevisionSheetsByChapter hits the new listing endpoint', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: { success: true, message: 'OK', data: [{ id: 1, title: 'F1', description: null, file_size_kb: 100, is_free: true, status: 'published' }] },
    });

    const sheets = await courseService.getRevisionSheetsByChapter(3);

    expect(mockedApiClient.get).toHaveBeenCalledWith('/courses/chapters/3/revision-sheets');
    expect(sheets).toHaveLength(1);
  });

  it('getRevisionSheet returns the signed_url payload', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'OK',
        data: {
          id: 1, title: 'F1', description: null, file_size_kb: 100, is_free: true, status: 'published',
          chapter: { id: 3, title: 'Chapitre 3' },
          signed_url: 'https://r2.example.com/signed',
          signed_url_expires_at: '2026-12-31T00:00:00Z',
        },
      },
    });

    const sheet = await courseService.getRevisionSheet(1);

    expect(mockedApiClient.get).toHaveBeenCalledWith('/courses/revision-sheets/1');
    expect(sheet.signed_url).toContain('signed');
  });

  it('getChapterVideosByChapter hits the new listing endpoint', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: { success: true, message: 'OK', data: [] },
    });

    await courseService.getChapterVideosByChapter(3);

    expect(mockedApiClient.get).toHaveBeenCalledWith('/courses/chapters/3/chapter-videos');
  });

  it('getChapterVideo returns the youtube_video_id', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'OK',
        data: {
          id: 5, title: 'V1', description: null, youtube_video_id: 'abc123',
          duration_sec: 600, thumbnail_url: null, is_free: true, status: 'published',
          chapter: { id: 3, title: 'Chapitre 3' },
        },
      },
    });

    const video = await courseService.getChapterVideo(5);

    expect(mockedApiClient.get).toHaveBeenCalledWith('/courses/chapter-videos/5');
    expect(video.youtube_video_id).toBe('abc123');
  });
});
