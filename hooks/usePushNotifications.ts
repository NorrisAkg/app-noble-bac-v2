import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { router, type Href } from 'expo-router';
import {
  registerForPushNotifications,
  syncPushTokenWithBackend,
} from '@/services/pushNotificationService';
import { getUnreadCount } from '@/services/notificationApiService';
import { resolveNotificationLink } from '@/utils/notificationLink';

/**
 * Route to the deep-link carried by a tapped notification, if any.
 * Dedupes by notification identifier so a cold-start tap isn't handled twice
 * (once via getLastNotificationResponseAsync, once via the live listener).
 */
function routeFromResponse(
  response: Notifications.NotificationResponse | null,
  handled: Set<string>,
): void {
  if (!response) {
    return;
  }

  const id = response.notification.request.identifier;
  if (handled.has(id)) {
    return;
  }
  handled.add(id);

  const data = response.notification.request.content.data as
    | Record<string, unknown>
    | null
    | undefined;
  const link = resolveNotificationLink(data);

  if (link) {
    router.push(link as Href);
  }
}

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
  const handledResponses = useRef<Set<string>>(new Set());

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

      // Cold start: the app was launched by tapping a push.
      const last = await Notifications.getLastNotificationResponseAsync();
      if (mounted) {
        routeFromResponse(last, handledResponses.current);
      }
    })();

    notificationListener.current = Notifications.addNotificationReceivedListener(() => {
      // Notification received while app is in foreground — nothing to route yet.
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        // User tapped a notification (app running or backgrounded).
        routeFromResponse(response, handledResponses.current);
      },
    );

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
