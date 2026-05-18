import { getCountries } from '../services/referentialService';
import apiClient from '../services/apiClient';
import type { Country } from '../types/api';

jest.mock('../services/apiClient');

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

const countriesFixture: Country[] = [
  {
    id: '1',
    name: 'Sénégal',
    iso_code: 'SN',
    phone_code: '+221',
    currency_code: 'XOF',
    cinetpay_supported: true,
    series: [{ id: '10', name: 'S1' }],
  },
  {
    id: '2',
    name: "Côte d'Ivoire",
    iso_code: 'CI',
    phone_code: '+225',
    currency_code: 'XOF',
    cinetpay_supported: true,
    series: [],
  },
];

describe('referentialService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getCountries GET /countries et deballe data.data', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: { success: true, message: 'OK', data: countriesFixture },
    });

    const result = await getCountries();

    expect(mockedApiClient.get).toHaveBeenCalledWith('/countries');
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Sénégal');
    expect(result[1].iso_code).toBe('CI');
  });

  it('propage l\'erreur axios telle quelle', async () => {
    mockedApiClient.get.mockRejectedValueOnce(new Error('Network down'));
    await expect(getCountries()).rejects.toThrow('Network down');
  });
});
