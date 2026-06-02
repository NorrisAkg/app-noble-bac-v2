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
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ChevronLeft, Trash2, FileText, BookOpen, ScrollText, Wifi, Download } from 'lucide-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { listDownloads, revokeDownload } from '@/services/myDownloadsService';
import { getApiErrorMessage } from '@/utils/apiError';
import { useOfflinePreferences } from '@/hooks/useOfflinePreferences';
import { EmptyState } from '@/components/ui/EmptyState';
import { IllustrationEmptyDownloads } from '@/components/ui/EmptyIllustrations';
import { C } from '@/constants/theme';
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

/**
 * Badge court coloré par type — aligné `screens-offline.jsx:161-165`.
 * Le rouge tomato distingue les PDF/livres, le vert les fiches, le bleu
 * les corrigés (pas de catégorie « vidéo » côté offline pour l'instant).
 */
function typeBadge(type: OfflineDownloadableType): { label: string; bg: string; fg: string } {
  switch (type) {
    case 'book':
      return { label: 'PDF', bg: C.dangerSoft, fg: C.danger };
    case 'revision_sheet':
      return { label: 'FICHE', bg: C.greenSoft, fg: C.green };
    case 'correction':
      return { label: 'CORRIGÉ', bg: C.infoSoft, fg: C.info };
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

  const { prefs, update: updatePrefs } = useOfflinePreferences();

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
        {/* Préférences offline — stockées en AsyncStorage tant que
            l'API n'expose pas /me/preferences (BACKEND_GAPS 7.2). */}
        <View style={styles.prefsCard}>
          <View style={styles.prefsRow}>
            <View style={styles.prefsIconBox}>
              <Wifi size={18} color={C.green} strokeWidth={2.2} />
            </View>
            <View style={styles.prefsTextCol}>
              <Text style={styles.prefsLabel}>Télécharger en Wi-Fi uniquement</Text>
              <Text style={styles.prefsHint}>Économise tes données mobiles</Text>
            </View>
            <Switch
              value={prefs.wifiOnly}
              onValueChange={(v) => updatePrefs({ wifiOnly: v })}
              trackColor={{ false: C.line, true: C.green }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.prefsSeparator} />
          <View style={styles.prefsRow}>
            <View style={styles.prefsIconBox}>
              <Download size={18} color={C.green} strokeWidth={2.2} />
            </View>
            <View style={styles.prefsTextCol}>
              <Text style={styles.prefsLabel}>Téléchargement automatique</Text>
              <Text style={styles.prefsHint}>Suggestions à jour sans action</Text>
            </View>
            <Switch
              value={prefs.autoDownload}
              onValueChange={(v) => updatePrefs({ autoDownload: v })}
              trackColor={{ false: C.line, true: C.green }}
              thumbColor="#fff"
            />
          </View>
        </View>

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
          <EmptyState
            illustration={IllustrationEmptyDownloads}
            title="Aucun téléchargement actif"
            description="Télécharge un livre, une fiche ou un corrigé depuis le visualiseur PDF pour le retrouver ici."
          />
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
  const badge = typeBadge(download.downloadable_type);

  return (
    <View style={styles.row}>
      <View style={[styles.rowIconWrap, { backgroundColor: badge.bg }]}>
        <Icon size={20} color={badge.fg} strokeWidth={2} />
      </View>
      <View style={styles.rowInfo}>
        <View style={styles.rowTitleRow}>
          <Text style={styles.rowTitle} numberOfLines={1}>{title}</Text>
          <View style={[styles.rowBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.rowBadgeText, { color: badge.fg }]}>{badge.label}</Text>
          </View>
        </View>
        <Text style={styles.rowMeta}>
          {formatSize(download.file_size_kb)} · {formatDate(download.downloaded_at)}
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
          <ActivityIndicator size="small" color={C.danger} />
        ) : (
          <Trash2 size={18} color={C.danger} strokeWidth={2} />
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
  rowTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: '#1A2027',
    flexShrink: 1,
  },
  rowBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rowBadgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 9,
    letterSpacing: 0.5,
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

  // Préférences offline
  prefsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 4,
    marginTop: 16,
    shadowColor: '#1A2027',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  prefsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  prefsIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: C.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefsTextCol: {
    flex: 1,
  },
  prefsLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13.5,
    color: C.ink,
  },
  prefsHint: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11.5,
    color: C.ink3,
    marginTop: 2,
  },
  prefsSeparator: {
    height: 1,
    backgroundColor: C.line,
    marginHorizontal: 14,
  },
});
