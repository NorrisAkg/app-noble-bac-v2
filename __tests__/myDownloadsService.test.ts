import {
  declareDownload,
  getDownload,
  getQuota,
  listDownloads,
  revokeDownload,
} from '../services/myDownloadsService';
import apiClient from '../services/apiClient';
import type { OfflineQuotaStatus, UserDownload } from '../types/api';

jest.mock('../services/apiClient');

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

const quotaFixture: OfflineQuotaStatus = {
  used_kb: 12_000,
  used_mb: 11.72,
  remaining_kb: 500_000,
  remaining_mb: 488.28,
  max_kb: 512_000,
  max_mb: 500,
  window_days: 90,
  usage_percentage: 2.34,
};

const downloadFixture: UserDownload = {
  id: 42,
  downloadable_type: 'book',
  downloadable_id: 7,
  downloadable: { id: 7, title: 'Mécanique du Point', author: 'P. Diop', page_count: 240 },
  file_size_kb: 4500,
  status: 'active',
  is_active: true,
  downloaded_at: '2026-05-18T10:00:00Z',
  last_opened_at: null,
  expires_at: null,
  signed_url: 'https://r2.example/signed',
  signed_url_expires_at: '2026-05-18T12:00:00Z',
};

describe('myDownloadsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('listDownloads GET /me/downloads + extraction meta.quota', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'OK',
        data: [downloadFixture],
        meta: { quota: quotaFixture },
      },
    });

    const result = await listDownloads();

    expect(mockedApiClient.get).toHaveBeenCalledWith('/me/downloads');
    expect(result.downloads).toHaveLength(1);
    expect(result.downloads[0].id).toBe(42);
    expect(result.quota?.usage_percentage).toBe(2.34);
  });

  it('listDownloads gere une reponse sans meta.quota (defensif)', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: { success: true, message: 'OK', data: [] },
    });

    const result = await listDownloads();

    expect(result.downloads).toHaveLength(0);
    // meta.quota absent => null cast (pas crash).
    expect(result.quota).toBeNull();
  });

  it('getQuota GET /me/downloads/quota et deballe data', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: { success: true, message: 'OK', data: quotaFixture },
    });

    const result = await getQuota();

    expect(mockedApiClient.get).toHaveBeenCalledWith('/me/downloads/quota');
    expect(result.max_mb).toBe(500);
    expect(result.window_days).toBe(90);
  });

  it('declareDownload POST /me/downloads avec payload type+id', async () => {
    mockedApiClient.post.mockResolvedValueOnce({
      data: { success: true, message: 'Created', data: downloadFixture },
    });

    const result = await declareDownload({ downloadable_type: 'book', downloadable_id: 7 });

    expect(mockedApiClient.post).toHaveBeenCalledWith('/me/downloads', {
      downloadable_type: 'book',
      downloadable_id: 7,
    });
    expect(result.id).toBe(42);
  });

  it('declareDownload propage l\'erreur 422 quota exceeded', async () => {
    const quotaError = Object.assign(new Error('QUOTA_EXCEEDED'), {
      response: {
        status: 422,
        data: {
          success: false,
          message: 'Quota dépassé',
          errors: {
            suggestion: {
              kb_needed: 5000,
              kb_remaining: 1000,
              kb_to_free: 4000,
              download_ids: [11, 12],
            },
          },
        },
      },
    });
    mockedApiClient.post.mockRejectedValueOnce(quotaError);

    await expect(
      declareDownload({ downloadable_type: 'book', downloadable_id: 99 }),
    ).rejects.toMatchObject({ response: { status: 422 } });
  });

  it('getDownload GET /me/downloads/{id} et deballe data', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: { success: true, message: 'OK', data: downloadFixture },
    });

    const result = await getDownload(42);

    expect(mockedApiClient.get).toHaveBeenCalledWith('/me/downloads/42');
    expect(result.signed_url).toBe('https://r2.example/signed');
  });

  it('revokeDownload DELETE /me/downloads/{id} (204 No Content)', async () => {
    mockedApiClient.delete.mockResolvedValueOnce({ data: null, status: 204 });

    await revokeDownload(42);

    expect(mockedApiClient.delete).toHaveBeenCalledWith('/me/downloads/42');
  });
});
