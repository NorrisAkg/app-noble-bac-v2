import React, { useCallback } from 'react';
import {
  Alert,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ChevronLeft, CheckCheck, Trash2 } from 'lucide-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllNotifications,
  type AppNotification,
} from '@/services/notificationApiService';
import { getApiErrorMessage } from '@/utils/apiError';
import { EmptyState } from '@/components/ui/EmptyState';
import { IllustrationEmptyNotifications } from '@/components/ui/EmptyIllustrations';
import { C } from '@/constants/theme';

const NOTIF_QUERY_KEY = ['notifications'] as const;
const UNREAD_COUNT_KEY = ['notifications', 'unread-count'] as const;

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function NotificationRow({
  item,
  onMarkRead,
  onDelete,
}: {
  item: AppNotification;
  onMarkRead: (id: number) => void;
  onDelete: (item: AppNotification) => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.row, !item.is_read && styles.rowUnread]}
      activeOpacity={0.7}
      onPress={() => !item.is_read && onMarkRead(item.id)}
    >
      <View style={[styles.dot, item.is_read && styles.dotRead]} />
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.rowBody} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={styles.rowDate}>{formatDate(item.created_at)}</Text>
      </View>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => onDelete(item)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Trash2 size={16} color={C.ink3} strokeWidth={2} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: NOTIF_QUERY_KEY,
    queryFn: () => getNotifications(1),
    staleTime: 60 * 1000,
  });

  const notifications: AppNotification[] = data?.data ?? [];

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIF_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIF_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIF_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
    onError: (err) => {
      Alert.alert('Suppression impossible', getApiErrorMessage(err));
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: deleteAllNotifications,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIF_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
    onError: (err) => {
      Alert.alert('Suppression impossible', getApiErrorMessage(err));
    },
  });

  const confirmDelete = useCallback(
    (item: AppNotification) => {
      Alert.alert('Supprimer cette notification ?', item.title, [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(item.id),
        },
      ]);
    },
    [deleteMutation],
  );

  const confirmDeleteAll = () => {
    Alert.alert(
      'Tout effacer ?',
      'Toutes tes notifications seront définitivement supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Tout effacer',
          style: 'destructive',
          onPress: () => deleteAllMutation.mutate(),
        },
      ],
    );
  };

  const hasUnread = notifications.some((n) => !n.is_read);

  const renderItem = useCallback(
    ({ item }: { item: AppNotification }) => (
      <NotificationRow
        item={item}
        onMarkRead={(id) => markReadMutation.mutate(id)}
        onDelete={confirmDelete}
      />
    ),
    [markReadMutation, confirmDelete],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={22} color={C.ink} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerActions}>
          {hasUnread && (
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
            >
              <CheckCheck size={18} color={C.green} strokeWidth={2} />
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={confirmDeleteAll}
              disabled={deleteAllMutation.isPending}
            >
              <Trash2 size={18} color={C.danger} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={C.green} />
        </View>
      ) : notifications.length === 0 ? (
        <EmptyState
          illustration={IllustrationEmptyNotifications}
          title="Aucune notification"
          description="Tes notifications apparaîtront ici."
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={C.green}
            />
          }
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: C.ink,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    minWidth: 40,
    justifyContent: 'flex-end',
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    padding: 4,
    marginTop: 2,
    flexShrink: 0,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  rowUnread: {
    backgroundColor: C.greenSoft,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.green,
    marginTop: 5,
    flexShrink: 0,
  },
  dotRead: {
    backgroundColor: C.line,
  },
  rowTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13.5,
    color: C.ink,
  },
  rowBody: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12.5,
    color: C.ink2,
    lineHeight: 18,
  },
  rowDate: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: C.ink3,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: C.line,
    marginLeft: 40,
  },
});
