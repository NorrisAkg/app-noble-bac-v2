import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { useExamDate } from '@/hooks/useExamDate';
import { getProfile } from '@/services/profileService';
import { getExamDate } from '@/services/referentialService';
import type { ExamDateInfo, UserProfile } from '@/types/api';

jest.mock('@/services/profileService');
jest.mock('@/services/referentialService');

const mockedGetProfile = getProfile as jest.MockedFunction<typeof getProfile>;
const mockedGetExamDate = getExamDate as jest.MockedFunction<typeof getExamDate>;

const profileFixture = {
  active_country: { id: 7, name: 'Sénégal', code: 'SN', flag_emoji: '🇸🇳' },
  active_series: { id: 3, label: 'Bac S1', code: 'S1' },
} as UserProfile;

const examDateFixture: ExamDateInfo = {
  country_id: 7,
  year: 2027,
  exam_date: '2027-06-17',
  days_remaining: 312,
};

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

function notFoundError(): AxiosError {
  return new AxiosError('Not Found', 'ERR_BAD_REQUEST', undefined, undefined, {
    status: 404,
    statusText: 'Not Found',
    data: { success: false, message: 'Aucune date d\'examen pour ce pays.' },
    headers: {},
    config: { headers: {} } as never,
  });
}

describe('useExamDate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetProfile.mockResolvedValue(profileFixture);
  });

  it('interroge le pays actif, pas le pays d\'inscription', async () => {
    mockedGetExamDate.mockResolvedValue(examDateFixture);

    const { result } = await renderHook(() => useExamDate(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.year).toBe(2027));
    expect(mockedGetExamDate).toHaveBeenCalledWith(7);
  });

  it('sert le compte à rebours du serveur sans le recalculer', async () => {
    // 312 est volontairement incohérent avec la date : si le hook recalculait
    // à partir de `exam_date`, il divergerait de la colonne « Jours restants »
    // du back-office d'un jour selon le fuseau de l'appareil.
    mockedGetExamDate.mockResolvedValue(examDateFixture);

    const { result } = await renderHook(() => useExamDate(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.daysRemaining).toBe(312));
  });

  /**
   * Invariant : les composantes affichées sont exactement celles de la chaîne
   * `YYYY-MM-DD`, dans n'importe quel fuseau. `new Date('2027-06-17')` ne le
   * respecte pas — la spec l'interprète en UTC, donc il affiche le 16 partout
   * à l'ouest de Greenwich, c'est-à-dire dans toute l'UEMOA. Le test tourne ici
   * en UTC et ne peut donc pas prendre la régression sur le fait, mais il
   * documente et verrouille la propriété attendue.
   */
  it('affiche exactement le jour et le mois saisis', async () => {
    mockedGetExamDate.mockResolvedValue(examDateFixture);

    const { result } = await renderHook(() => useExamDate(), { wrapper: makeWrapper() });

    const [year, month, day] = examDateFixture.exam_date.split('-').map(Number);

    await waitFor(() => expect(result.current.day).toBe(day));
    expect(result.current.year).toBe(year);
    expect(result.current.month).toContain('juin');
    expect(month).toBe(6);
  });

  it('renvoie des champs nuls quand aucune date n\'est saisie', async () => {
    mockedGetExamDate.mockRejectedValue(notFoundError());

    const { result } = await renderHook(() => useExamDate(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.daysRemaining).toBeNull();
    expect(result.current.day).toBeNull();
    expect(result.current.year).toBeNull();
  });

  it('ne réessaie pas un 404', async () => {
    mockedGetExamDate.mockRejectedValue(notFoundError());

    const { result } = await renderHook(() => useExamDate(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockedGetExamDate).toHaveBeenCalledTimes(1);
  });

  it('n\'appelle pas l\'API tant que le profil n\'est pas chargé', async () => {
    mockedGetProfile.mockReturnValue(new Promise(() => {}));

    await renderHook(() => useExamDate(), { wrapper: makeWrapper() });

    expect(mockedGetExamDate).not.toHaveBeenCalled();
  });
});
