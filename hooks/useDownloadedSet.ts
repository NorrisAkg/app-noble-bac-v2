import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { listDownloads } from '@/services/myDownloadsService';
import type { OfflineDownloadableType } from '@/types/api';

const DOWNLOADS_QUERY_KEY = ['my-downloads'] as const;

/**
 * Renvoie un Set des identifiants polymorphes deja telecharges
 * (format "{type}:{id}"), pour lookup O(1) dans les listes d'ecrans
 * courses / library / books. Le hook partage le cache TanStack Query
 * avec le screen "Mes telechargements" : pas de double fetch.
 *
 * Usage :
 *   const downloaded = useDownloadedSet();
 *   downloaded.has('book:7') // true / false
 */
export function useDownloadedSet(): {
  has: (key: string) => boolean;
  isDownloaded: (type: OfflineDownloadableType, id: number) => boolean;
  isLoading: boolean;
} {
  const { data, isLoading } = useQuery({
    queryKey: DOWNLOADS_QUERY_KEY,
    queryFn: listDownloads,
    staleTime: 60 * 1000,
  });

  const set = useMemo(() => {
    const s = new Set<string>();
    for (const d of data?.downloads ?? []) {
      s.add(`${d.downloadable_type}:${d.downloadable_id}`);
    }
    return s;
  }, [data]);

  return {
    has: (key: string) => set.has(key),
    isDownloaded: (type, id) => set.has(`${type}:${id}`),
    isLoading,
  };
}
