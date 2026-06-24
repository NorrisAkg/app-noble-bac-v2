import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@/store/useAuthStore';

export default function IndexScreen() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  // Single source of truth for the cold-start route. Using <Redirect> (resolved
  // during render, before the target paints) instead of a post-paint
  // router.replace effect means a logged-in user never sees a /landing frame.
  if (process.env.EXPO_PUBLIC_BYPASS_AUTH === 'true') {
    return <Redirect href="/(tabs)" />;
  }

  // Wait for SecureStore rehydration so isAuthenticated is accurate before
  // deciding. The plain green background matches the native splash colour
  // (#3DBE45) so there is no flash between splash and the first screen.
  if (!isHydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: '#3DBE45' }}>
        <StatusBar style="light" />
      </View>
    );
  }

  return <Redirect href={isAuthenticated ? '/(tabs)' : '/landing'} />;
}
