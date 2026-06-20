import { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@/store/useAuthStore';

export default function IndexScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    if (process.env.EXPO_PUBLIC_BYPASS_AUTH === 'true') {
      router.replace('/(tabs)');
      return;
    }
    // Wait for SecureStore rehydration so isAuthenticated is accurate before
    // redirecting — otherwise a connected user briefly lands on /landing.
    if (!isHydrated) return;
    router.replace(isAuthenticated ? '/(tabs)' : '/landing');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated]);

  // Plain green background matches the native splash colour (#3DBE45)
  // so there is no flash between the native splash and the landing screen.
  return (
    <View style={{ flex: 1, backgroundColor: '#3DBE45' }}>
      <StatusBar style="light" />
    </View>
  );
}
