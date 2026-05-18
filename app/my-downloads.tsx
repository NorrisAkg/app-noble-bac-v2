import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ChevronLeft, Trash2, FileText, BookOpen, ScrollText } from 'lucide-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { listDownloads, revokeDownload } from '@/services/myDownloadsService';
import { getApiErrorMessage } from '@/utils/apiError';
import type { OfflineDownloadableType, UserDownload } from '@/types/api';

const DOWNLOADS_QUERY_KEY = ['my-downloads'] as const;

function typeIcon(type: OfflineDownloadableType) {
  switch (type) {
    case 'book':
      return BookOpen;
    case 'revision_sheet':
      return ScrollText;
    case 'correction':
    default:
      return FileText;
  }
}

function typeLabel(type: OfflineDownloadableType): string {
  switch (type) {
    case 'book':
      return 'Livre';
    case 'revision_sheet':
      return 'Fiche de révision';
    case 'correction':
      return 'Corrigé';
  }
}

function formatSize(kb: number): string {
  if (kb < 1024) return `${kb} Ko`;
  return `${(kb / 1024).toFixed(1)} Mo`;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  } catch {
    return '—';
  }
}

export default function MyDownloadsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: DOWNLOADS_QUERY_KEY,
    queryFn: listDownloads,
    staleTime: 30 * 1000,
  });

  const downloads = data?.downloads ?? [];
  const quota = data?.quota ?? null;

  const revokeMutation = useMutation({
    mutationFn: (id: number) => revokeDownload(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DOWNLOADS_QUERY_KEY });
    },
    onError: (err) => {
      Alert.alert('Suppression impossible', getApiErrorMessage(err));
    },
  });

  const confirmRevoke = (download: UserDownload) => {
    Alert.alert(
      'Libérer cet espace ?',
      `Le téléchargement "${download.downloadable?.title ?? typeLabel(download.downloadable_type)}" sera supprimé de tes téléchargements. Tu pourras le re-télécharger plus tard si l'abonnement le permet.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => revokeMutation.mutate(download.id),
        },
      ],
    );
  };

  const usagePct = quota?.usage_percentage ?? 0;
  const usageMb = quota?.used_mb ?? 0;
  const maxMb = quota?.max_mb ?? 500;
  const remainingMb = quota?.remaining_mb ?? 0;
  const windowDays = quota?.window_days ?? 90;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={{ height: insets.top, backgroundColor: '#3DBE45' }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes téléchargements</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor="#3DBE45" />}
      >
        {/* Quota card */}
        <View style={styles.quotaCard}>
          <View style={styles.quotaHeaderRow}>
            <Text style={styles.quotaTitle}>Quota offline</Text>
            <Text style={styles.quotaMeta}>{windowDays} j glissants</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(100, usagePct)}%` as any }]} />
          </View>
          <View style={styles.quotaRow}>
            <Text style={styles.quotaValue}>
              {usageMb.toFixed(1)} Mo / {maxMb} Mo
            </Text>
            <Text style={styles.quotaRemaining}>{remainingMb.toFixed(1)} Mo restants</Text>
          </View>
        </View>

        {isLoading && downloads.length === 0 ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color="#3DBE45" />
          </View>
        ) : downloads.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateText}>Aucun téléchargement actif.</Text>
            <Text style={styles.stateSubText}>
              Télécharge un livre, une fiche ou un corrigé depuis le visualiseur PDF pour le retrouver ici.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {downloads.map((d) => (
              <DownloadRow
                key={d.id}
                download={d}
                onRevoke={() => confirmRevoke(d)}
                isRevoking={revokeMutation.isPending && revokeMutation.variables === d.id}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

interface DownloadRowProps {
  download: UserDownload;
  onRevoke: () => void;
  isRevoking: boolean;
}

const DownloadRow: React.FC<DownloadRowProps> = ({ download, onRevoke, isRevoking }) => {
  const Icon = typeIcon(download.downloadable_type);
  const title = download.downloadable?.title ?? typeLabel(download.downloadable_type);

  return (
    <View style={styles.row}>
      <View style={styles.rowIconWrap}>
        <Icon size={20} color="#3DBE45" strokeWidth={2} />
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.rowMeta}>
          {typeLabel(download.downloadable_type)} · {formatSize(download.file_size_kb)} · {formatDate(download.downloaded_at)}
        </Text>
      </View>
      <TouchableOpacity
        onPress={onRevoke}
        disabled={isRevoking}
        style={styles.rowAction}
        hitSlop={8}
        accessibilityLabel="Supprimer ce téléchargement"
      >
        {isRevoking ? (
          <ActivityIndicator size="small" color="#E14B36" />
        ) : (
          <Trash2 size={18} color="#E14B36" strokeWidth={2} />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    height: 64,
    backgroundColor: '#3DBE45',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 17,
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  quotaCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    shadowColor: '#1A2027',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  quotaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  quotaTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: '#1A2027',
  },
  quotaMeta: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: '#9AA3AC',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EEF1F4',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3DBE45',
    borderRadius: 4,
  },
  quotaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 10,
  },
  quotaValue: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#1A2027',
  },
  quotaRemaining: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: '#5A6470',
  },
  stateBox: {
    paddingVertical: 40,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  stateText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: '#1A2027',
    textAlign: 'center',
  },
  stateSubText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#9AA3AC',
    textAlign: 'center',
    marginTop: 8,
  },
  list: {
    marginTop: 16,
    gap: 10,
  },
  row: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#1A2027',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  rowIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EAF7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: '#1A2027',
  },
  rowMeta: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: '#9AA3AC',
    marginTop: 2,
  },
  rowAction: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
