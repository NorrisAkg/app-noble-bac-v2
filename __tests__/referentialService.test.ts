import { getCountries, getExamDate, getOperators } from '../services/referentialService';
import apiClient from '../services/apiClient';
import type { Country, ExamDateInfo, Operator } from '../types/api';

jest.mock('../services/apiClient');

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

const countriesFixture: Country[] = [
  {
    id: '1',
    name: 'Sénégal',
    code: 'SN',
    phone_code: '+221',
    flag_emoji: '🇸🇳',
    payment_enabled: true,
    is_active: true,
    series: [{ id: '10', code: 'S1', label: 'Bac S1' }],
  },
  {
    id: '2',
    name: "Côte d'Ivoire",
    code: 'CI',
    phone_code: '+225',
    flag_emoji: '🇨🇮',
    payment_enabled: true,
    is_active: true,
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
    expect(result[1].code).toBe('CI');
  });

  it('propage l\'erreur axios telle quelle', async () => {
    mockedApiClient.get.mockRejectedValueOnce(new Error('Network down'));
    await expect(getCountries()).rejects.toThrow('Network down');
  });

  it('getOperators GET /countries/{id}/operators et deballe data.data', async () => {
    const operatorsFixture: Operator[] = [
      { id: 1, code: 'orange_ci', name: 'Orange Money', color: '#FF6600', logo_url: null },
      { id: 2, code: 'mtn_ci', name: 'MTN MoMo', color: '#FFCC00', logo_url: null },
    ];
    mockedApiClient.get.mockResolvedValueOnce({
      data: { success: true, message: 'OK', data: operatorsFixture },
    });

    const result = await getOperators('2');

    expect(mockedApiClient.get).toHaveBeenCalledWith('/countries/2/operators');
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Orange Money');
  });

  it('getOperators renvoie une liste vide quand le pays n\'a pas d\'operateur', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: { success: true, message: 'OK', data: [] },
    });

    const result = await getOperators(99);
    expect(result).toEqual([]);
  });

  it('getExamDate GET /countries/{id}/exam-date et deballe data.data', async () => {
    const examDateFixture: ExamDateInfo = {
      country_id: 2,
      year: 2027,
      exam_date: '2027-06-17',
      days_remaining: 312,
    };
    mockedApiClient.get.mockResolvedValueOnce({
      data: { success: true, message: 'OK', data: examDateFixture },
    });

    const result = await getExamDate(2);

    expect(mockedApiClient.get).toHaveBeenCalledWith('/countries/2/exam-date');
    expect(result).toEqual(examDateFixture);
  });

  it('getExamDate propage le 404 au lieu de l\'avaler', async () => {
    // L'absence de date est un cas nominal, mais c'est au hook de la traiter :
    // un service qui renverrait null ici rendrait le 404 indistinguable d'une
    // panne réseau.
    mockedApiClient.get.mockRejectedValueOnce(new Error('Request failed with status code 404'));

    await expect(getExamDate(2)).rejects.toThrow('404');
  });
});
