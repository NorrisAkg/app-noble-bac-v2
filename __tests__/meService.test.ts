import { getLastRead, getMeStats, upsertLastRead } from '../services/meService';
import apiClient from '../services/apiClient';
import type { LastRead } from '@/types/api';

jest.mock('../services/apiClient');

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

const lessonLastRead: LastRead = {
  readable_type: 'lesson',
  readable_id: 12,
  title: 'Dissertation littéraire',
  subject_name: 'Français',
  page_current: null,
  page_total: null,
  progress_pct: 60,
  last_opened_at: '2026-06-12T10:00:00+00:00',
};

describe('meService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getMeStats returns the aggregated stats', async () => {
    const stats = { quiz_count: 4, average_score_pct: 72.5, exams_consulted: 3 };
    mockedApiClient.get.mockResolvedValueOnce({
      data: { success: true, message: 'OK', data: stats },
    });

    const result = await getMeStats();

    expect(mockedApiClient.get).toHaveBeenCalledWith('/me/stats');
    expect(result).toEqual(stats);
  });

  it('getLastRead returns the most recent reading progress', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: { success: true, message: 'OK', data: lessonLastRead },
    });

    const result = await getLastRead();

    expect(mockedApiClient.get).toHaveBeenCalledWith('/me/last-read');
    expect(result).toEqual(lessonLastRead);
  });

  it('getLastRead returns null when nothing was ever opened', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: { success: true, message: 'OK', data: null },
    });

    await expect(getLastRead()).resolves.toBeNull();
  });

  it('upsertLastRead declares a lesson with its scroll progress', async () => {
    mockedApiClient.patch.mockResolvedValueOnce({
      data: { success: true, message: 'OK', data: lessonLastRead },
    });

    const result = await upsertLastRead({
      readable_type: 'lesson',
      readable_id: 12,
      progress_pct: 60,
    });

    expect(mockedApiClient.patch).toHaveBeenCalledWith('/me/last-read', {
      readable_type: 'lesson',
      readable_id: 12,
      progress_pct: 60,
    });
    expect(result).toEqual(lessonLastRead);
  });

  it('upsertLastRead declares a revision sheet with its page position', async () => {
    const sheetLastRead: LastRead = {
      ...lessonLastRead,
      readable_type: 'revision_sheet',
      readable_id: 7,
      title: 'Fiche Optique géométrique',
      subject_name: 'Physique',
      page_current: 3,
      page_total: 6,
      progress_pct: 50,
    };
    mockedApiClient.patch.mockResolvedValueOnce({
      data: { success: true, message: 'OK', data: sheetLastRead },
    });

    const result = await upsertLastRead({
      readable_type: 'revision_sheet',
      readable_id: 7,
      page_current: 3,
      page_total: 6,
      progress_pct: 50,
    });

    expect(mockedApiClient.patch).toHaveBeenCalledWith('/me/last-read', {
      readable_type: 'revision_sheet',
      readable_id: 7,
      page_current: 3,
      page_total: 6,
      progress_pct: 50,
    });
    expect(result).toEqual(sheetLastRead);
  });
});
