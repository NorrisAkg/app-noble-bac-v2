import { quotesService } from '../services/quotesService';
import apiClient from '../services/apiClient';

jest.mock('../services/apiClient');

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('quotesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getQuotes returns the active quotes list', async () => {
    const quotes = [
      { id: 'q1', text: 'Petit à petit, l’oiseau fait son nid.', author: 'Proverbe' },
      { id: 'q2', text: 'Le savoir est une lumière.', author: null },
    ];
    mockedApiClient.get.mockResolvedValueOnce({
      data: { success: true, message: 'OK', data: quotes },
    });

    const result = await quotesService.getQuotes();

    expect(mockedApiClient.get).toHaveBeenCalledWith('/quotes');
    expect(result).toEqual(quotes);
  });

  it('getQuotes returns an empty list when no quote is active', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: { success: true, message: 'OK', data: [] },
    });

    await expect(quotesService.getQuotes()).resolves.toEqual([]);
  });
});
