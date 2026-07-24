import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

const PDF_DIR = `${FileSystem.documentDirectory}pdfs/`;

const backgroundCaching = new Set<string>();

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
 * Downloads `signedUrl` to the local cache in the background, without
 * blocking the caller. Writes to a temp file first and only registers the
 * cache entry once the download completes, so a partial/failed download
 * never leaves a corrupt file marked as cached.
 */
function cacheInBackground(cacheKey: string, signedUrl: string): void {
  if (backgroundCaching.has(cacheKey)) return;
  backgroundCaching.add(cacheKey);

  (async () => {
    await FileSystem.makeDirectoryAsync(PDF_DIR, { intermediates: true });
    const dest = `${PDF_DIR}${cacheKey}.pdf`;
    const tmp = `${PDF_DIR}${cacheKey}.${Date.now()}.tmp`;

    try {
      const resumable = FileSystem.createDownloadResumable(signedUrl, tmp);
      const result = await resumable.downloadAsync();
      if (!result || result.status !== 200) {
        throw new Error(`PDF background cache failed: HTTP ${result?.status}`);
      }
      await FileSystem.moveAsync({ from: tmp, to: dest });
      await AsyncStorage.setItem(storageKey(cacheKey), dest);
    } catch (err) {
      console.warn('[pdfCacheService] background caching failed:', err);
      await FileSystem.deleteAsync(tmp, { idempotent: true });
    } finally {
      backgroundCaching.delete(cacheKey);
    }
  })();
}

/**
 * Returns a URI for the PDF: a local `file://` URI if already cached, or the
 * signed network URL otherwise (letting the PDF.js viewer stream/render it
 * progressively instead of waiting for a full download). On a cache miss,
 * also kicks off a background download so subsequent opens serve the local
 * copy, including offline.
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
  cacheInBackground(cacheKey, signedUrl);
  return signedUrl;
}

export async function evictCachedPdf(cacheKey: string): Promise<void> {
  const stored = await AsyncStorage.getItem(storageKey(cacheKey));
  if (stored) {
    await FileSystem.deleteAsync(stored, { idempotent: true });
    await AsyncStorage.removeItem(storageKey(cacheKey));
  }
}
