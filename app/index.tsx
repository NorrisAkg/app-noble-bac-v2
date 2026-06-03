import { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@/store/useAuthStore';

export default function IndexScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (process.env.EXPO_PUBLIC_BYPASS_AUTH === 'true') {
      router.replace('/(tabs)');
      return;
    }
    router.replace(isAuthenticated ? '/(tabs)' : '/landing');
    // One-shot redirect on mount — intentionally no deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Plain green background matches the native splash colour (#3DBE45)
  // so there is no flash between the native splash and the landing screen.
  return (
    <View style={{ flex: 1, backgroundColor: '#3DBE45' }}>
      <StatusBar style="light" />
    </View>
  );
}
