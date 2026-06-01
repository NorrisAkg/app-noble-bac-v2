import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

const PDF_DIR = `${FileSystem.documentDirectory}pdfs/`;

function storageKey(cacheKey: string): string {
  return `pdf_local_v1_${cacheKey}`;
}

async function getLocalPath(cacheKey: string): Promise<string | null> {
  const stored = await AsyncStorage.getItem(storageKey(cacheKey));
  if (!stored) return null;
  const info = await FileSystem.getInfoAsync(stored);
  return info.exists ? stored : null;
}

/**
 * Returns a file:// URI for the PDF. Downloads and caches it on first access
 * (requires network). On subsequent calls, serves from local storage even
 * when offline.
 *
 * Throws 'OFFLINE_NO_CACHE' when offline and no local copy exists.
 */
export async function getCachedPdfUri(
  cacheKey: string,
  fetchSignedUrl: () => Promise<string>,
  isOnline: boolean,
): Promise<string> {
  const local = await getLocalPath(cacheKey);
  if (local) return local;

  if (!isOnline) throw new Error('OFFLINE_NO_CACHE');

  const signedUrl = await fetchSignedUrl();
  await FileSystem.makeDirectoryAsync(PDF_DIR, { intermediates: true });
  const dest = `${PDF_DIR}${cacheKey}.pdf`;
  const { status } = await FileSystem.downloadAsync(signedUrl, dest);
  if (status !== 200) throw new Error(`PDF download failed: HTTP ${status}`);

  await AsyncStorage.setItem(storageKey(cacheKey), dest);
  return dest;
}

export async function evictCachedPdf(cacheKey: string): Promise<void> {
  const stored = await AsyncStorage.getItem(storageKey(cacheKey));
  if (stored) {
    await FileSystem.deleteAsync(stored, { idempotent: true });
    await AsyncStorage.removeItem(storageKey(cacheKey));
  }
}
