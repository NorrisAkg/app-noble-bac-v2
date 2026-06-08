import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// ─── DEV: silence un log natif inoffensif de expo-video v3 ───────────────────
// Pendant un Fast Refresh (HMR), le shared object natif du player Android peut
// être libéré avant que la nouvelle SurfaceVideoView le remplace, déclenchant
// un log d'exception Java remonté ici comme console.error. La vidéo joue
// correctement au cold start ; cette erreur n'apparaît qu'en dev pendant les
// reloads et ne reflète pas un bug applicatif. On filtre uniquement ces motifs
// précis pour éviter de masquer d'autres erreurs.
if (__DEV__) {
  const expoVideoHmrPatterns: RegExp[] = [
    /Cannot use shared object that was already released/,
    /Cannot set prop 'player' on view 'class expo\.modules\.video\./,
  ];

  // 1) Masque l'erreur dans le LogBox in-app.
  LogBox.ignoreLogs(expoVideoHmrPatterns);

  // 2) Filtre la même erreur dans le terminal Metro. On override console.error
  //    en testant uniquement la première string ; tout autre log passe.
  const originalConsoleError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    const first = typeof args[0] === 'string' ? args[0] : '';
    if (expoVideoHmrPatterns.some((p) => p.test(first))) {
      return;
    }
    originalConsoleError(...args);
  };
}
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
import { PremiumGateProvider } from '@/providers/PremiumGateProvider';
import { QueryProvider, queryClient } from '@/providers/QueryProvider';
import { registerAuthCleanup } from '@/services/apiClient';
import { prefetchAllData } from '@/services/prefetchService';
import { useAuthStore } from '@/store/useAuthStore';
import { usePushNotifications } from '@/hooks/usePushNotifications';

function PushNotificationInitializer() {
  usePushNotifications();
  return null;
}

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
    registerAuthCleanup(() => useAuthStore.getState().clearLocal());
    initialize();
  }, [initialize]);

  // Pré-charge toutes les données texte/JSON dès que l'utilisateur est authentifié.
  // prefetchQuery est silencieux (pas de throw) et no-op si les données sont encore fraîches.
  useEffect(() => {
    if (isAuthenticated) {
      prefetchAllData(queryClient);
    }
  }, [isAuthenticated]);

  const wasOnlineRef = useRef<boolean | null>(null);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      const online = !!state.isConnected && state.isInternetReachable !== false;
      if (online && wasOnlineRef.current === false) {
        queryClient.invalidateQueries({ queryKey: ['subscription'] });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        queryClient.invalidateQueries({ queryKey: ['my-downloads'] });
      }
      wasOnlineRef.current = online;
    });
    return unsub;
  }, []);

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
        // L'écran congrats est volontairement post-auth (affiché après le succès
        // de verifyOtp). Sans cette exception, le guard court-circuiterait le
        // flow inscription → OTP → congrats → setup en redirigeant vers (tabs).
        if (segments[1] === 'congrats') return;
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
        {isAuthenticated && <PushNotificationInitializer />}
        <PremiumGateProvider>
          <ThemeProvider value={DefaultTheme}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
            </Stack>
            <OfflineBanner />
            <StatusBar style="auto" />
          </ThemeProvider>
        </PremiumGateProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}
