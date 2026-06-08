import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import apiClient from './apiClient';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Requests push permissions and returns the Expo push token.
 * Returns null on web or if the user denies permission.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync();
  return tokenData.data;
}

/**
 * Registers the Expo push token with the backend.
 * Safe to call multiple times — the backend is idempotent.
 */
export async function syncPushTokenWithBackend(token: string): Promise<void> {
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  await apiClient.post('/me/device-tokens', { token, platform });
}

/**
 * Unregisters the push token from the backend on logout.
 */
export async function unregisterPushToken(token: string): Promise<void> {
  await apiClient.delete('/me/device-tokens', { data: { token } });
}
