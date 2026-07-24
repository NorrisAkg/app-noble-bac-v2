import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

import { evictCachedPdf, getCachedPdfUri } from '../services/pdfCacheService';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///docs/',
  getInfoAsync: jest.fn(),
  deleteAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  moveAsync: jest.fn(),
  createDownloadResumable: jest.fn(),
}));

const mockedStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockedFs = FileSystem as jest.Mocked<typeof FileSystem>;

// Attend que les micro-tâches en file (le fire-and-forget de cacheInBackground)
// s'exécutent avant d'observer ses effets de bord.
async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe('pdfCacheService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedFs.makeDirectoryAsync.mockResolvedValue(undefined as any);
    mockedFs.moveAsync.mockResolvedValue(undefined as any);
    mockedFs.deleteAsync.mockResolvedValue(undefined as any);
  });

  it('sert le fichier local sans appel réseau quand déjà en cache', async () => {
    mockedStorage.getItem.mockResolvedValue('file:///docs/pdfs/book_1.pdf');
    mockedFs.getInfoAsync.mockResolvedValue({ exists: true } as any);

    const fetchSignedUrl = jest.fn();
    const uri = await getCachedPdfUri('book_1', fetchSignedUrl, true);

    expect(uri).toBe('file:///docs/pdfs/book_1.pdf');
    expect(fetchSignedUrl).not.toHaveBeenCalled();
    expect(mockedFs.createDownloadResumable).not.toHaveBeenCalled();
  });

  it('lève OFFLINE_NO_CACHE quand hors-ligne sans copie locale', async () => {
    mockedStorage.getItem.mockResolvedValue(null);

    await expect(getCachedPdfUri('book_2', jest.fn(), false)).rejects.toThrow('OFFLINE_NO_CACHE');
  });

  it('retourne l\'URL signée immédiatement, sans attendre le téléchargement de fond', async () => {
    mockedStorage.getItem.mockResolvedValue(null);
    let resolveDownload: (v: any) => void = () => {};
    const downloadAsync = jest.fn(
      () => new Promise((resolve) => { resolveDownload = resolve; }),
    );
    mockedFs.createDownloadResumable.mockReturnValue({ downloadAsync } as any);

    const fetchSignedUrl = jest.fn().mockResolvedValue('https://r2.example/signed.pdf');
    const uri = await getCachedPdfUri('book_3', fetchSignedUrl, true);

    expect(uri).toBe('https://r2.example/signed.pdf');
    expect(downloadAsync).toHaveBeenCalled();
    // Le téléchargement de fond n'est pas encore résolu : rien n'a encore été
    // écrit dans AsyncStorage à ce stade.
    expect(mockedStorage.setItem).not.toHaveBeenCalled();

    resolveDownload({ status: 200 });
    await flushMicrotasks();

    expect(mockedFs.moveAsync).toHaveBeenCalled();
    expect(mockedStorage.setItem).toHaveBeenCalledWith(
      'pdf_local_v1_book_3',
      expect.stringContaining('book_3.pdf'),
    );
  });

  it('supprime le fichier partiel et ne met pas à jour le cache si le téléchargement de fond échoue', async () => {
    mockedStorage.getItem.mockResolvedValue(null);
    const downloadAsync = jest.fn().mockRejectedValue(new Error('network drop'));
    mockedFs.createDownloadResumable.mockReturnValue({ downloadAsync } as any);

    const uri = await getCachedPdfUri('book_4', async () => 'https://r2.example/signed.pdf', true);
    expect(uri).toBe('https://r2.example/signed.pdf');

    await flushMicrotasks();

    expect(mockedFs.deleteAsync).toHaveBeenCalled();
    expect(mockedFs.moveAsync).not.toHaveBeenCalled();
    expect(mockedStorage.setItem).not.toHaveBeenCalled();
  });

  it('evictCachedPdf supprime le fichier local et l\'entrée AsyncStorage', async () => {
    mockedStorage.getItem.mockResolvedValue('file:///docs/pdfs/sheet_9.pdf');

    await evictCachedPdf('sheet_9');

    expect(mockedFs.deleteAsync).toHaveBeenCalledWith('file:///docs/pdfs/sheet_9.pdf', { idempotent: true });
    expect(mockedStorage.removeItem).toHaveBeenCalledWith('pdf_local_v1_sheet_9');
  });
});
