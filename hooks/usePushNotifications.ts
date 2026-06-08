import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import {
  registerForPushNotifications,
  syncPushTokenWithBackend,
} from '@/services/pushNotificationService';
import { getUnreadCount } from '@/services/notificationApiService';

/**
 * Initializes push notifications for the authenticated user.
 *
 * - Requests permission on first mount.
 * - Syncs the Expo push token with the backend (idempotent).
 * - Exposes the unread notification count for badge display.
 *
 * Must be called after the user is authenticated (Sanctum token available).
 */
export function usePushNotifications() {
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const token = await registerForPushNotifications();
      if (token && mounted) {
        try {
          await syncPushTokenWithBackend(token);
        } catch {
          // Non-fatal — the user can still use the app
        }
      }
    })();

    notificationListener.current = Notifications.addNotificationReceivedListener(() => {
      // Notification received while app is in foreground
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(() => {
      // User tapped a notification
    });

    return () => {
      mounted = false;
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: getUnreadCount,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  return { unreadCount };
}
