import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
  Poppins_900Black,
} from '@expo-google-fonts/poppins';
import 'react-native-reanimated';
import '@/global.css';

import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { QueryProvider } from '@/providers/QueryProvider';
import { registerAuthCleanup } from '@/services/apiClient';
import { useAuthStore } from '@/store/useAuthStore';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const { initialize, isAuthenticated } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  const [loaded, error] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    Poppins_900Black,
  });

  useEffect(() => {
    // Let apiClient drop the auth state locally when /auth/refresh fails on 401.
    registerAuthCleanup(() => useAuthStore.getState().clearLocal());
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  useEffect(() => {
    if (!loaded) return;

    // ─────────────────────────────────────────────────────────────────────────
    // DEV BYPASS — set EXPO_PUBLIC_BYPASS_AUTH=true in .env.local to skip the
    // auth guard and go straight to (tabs) while building other modules.
    // This variable is absent from all non‑local env files and has zero effect
    // in staging / production builds.
    // ─────────────────────────────────────────────────────────────────────────
    if (process.env.EXPO_PUBLIC_BYPASS_AUTH === 'true') return;

    const inTabsGroup = segments[0] === '(tabs)';
    const inAuthGroup = segments[0] === '(auth)';
    const isLanding = segments[0] === 'landing';

    // Onboarding au premier lancement : on bascule vers landing.tsx qui
    // sert d'ecran de bienvenue (video + CTA). Le flag AsyncStorage
    // 'hasSeenOnboarding' evite de re-presenter le landing apres la 1ere
    // visite (le landing lui-meme s'occupe de poser ce flag).
    const checkOnboarding = async () => {
      const seen = await AsyncStorage.getItem('hasSeenOnboarding');
      if (seen !== 'true') {
        router.replace('/landing');
        return;
      }
      if (!isAuthenticated && inTabsGroup) {
        router.replace('/landing');
      } else if (isAuthenticated && (inAuthGroup || isLanding)) {
        router.replace('/(tabs)');
      }
    };
    checkOnboarding();
  }, [isAuthenticated, segments, loaded, router]);


  if (!loaded && !error) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryProvider>
        <ThemeProvider value={DefaultTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
          </Stack>
          <OfflineBanner />
          <StatusBar style="auto" />
        </ThemeProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}
