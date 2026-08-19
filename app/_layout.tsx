import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { AppState, LogBox, type AppStateStatus } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
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
  //    en concaténant tous les arguments (le logger natif peut transmettre un
  //    objet Error ou placer le message au-delà du 1er argument) ; tout autre
  //    log passe intact.
  const originalConsoleError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    const combined = args
      .map((a) => (a instanceof Error ? a.message : typeof a === 'string' ? a : String(a)))
      .join(' ');
    if (expoVideoHmrPatterns.some((p) => p.test(combined))) {
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

import { ForceUpdateGate } from '@/components/ForceUpdateGate';
import { PasswordUpgradeGate } from '@/components/PasswordUpgradeGate';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { invalidateAdminManagedQueries, queryKeys } from '@/lib/queryKeys';
import { PremiumGateProvider } from '@/providers/PremiumGateProvider';
import { QueryProvider, queryClient } from '@/providers/QueryProvider';
import { registerAuthCleanup } from '@/services/apiClient';
import { loadAuthTrace, traceAuth } from '@/services/authTrace';
import { prefetchAllData } from '@/services/prefetchService';
import { useAuthStore } from '@/store/useAuthStore';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useForceUpdate } from '@/hooks/useForceUpdate';

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
  const { initialize, isAuthenticated, isHydrated, isNewUser, passwordUpgradeRequired } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const { isChecking: isCheckingVersion, mustUpdate, storeUrl } = useForceUpdate();

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
    // Recharge le journal d'auth persisté : les évènements d'une session
    // précédente doivent survivre au redémarrage de l'app, c'est souvent après
    // coup qu'on vient les lire.
    loadAuthTrace().then(() => traceAuth('démarrage de l\'app'));
    initialize();
  }, [initialize]);

  // Pré-charge toutes les données texte/JSON dès que l'utilisateur est authentifié.
  // prefetchQuery est silencieux (pas de throw) et no-op si les données sont encore fraîches.
  useEffect(() => {
    if (isAuthenticated && !mustUpdate && !passwordUpgradeRequired) {
      prefetchAllData(queryClient);
    }
  }, [isAuthenticated, mustUpdate, passwordUpgradeRequired]);

  const wasOnlineRef = useRef<boolean | null>(null);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      const online = !!state.isConnected && state.isInternetReachable !== false;
      if (online && wasOnlineRef.current === false) {
        queryClient.invalidateQueries({ queryKey: queryKeys.subscription.all() });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        queryClient.invalidateQueries({ queryKey: ['my-downloads'] });

        // Au retour du réseau, seuls le profil, l'abonnement et les
        // téléchargements étaient rafraîchis : le contenu édité en admin
        // (référentiel, cours, catalogue, quiz) restait sur la copie mise en
        // cache avant la coupure.
        invalidateAdminManagedQueries(queryClient);
      }
      wasOnlineRef.current = online;
    });
    return unsub;
  }, []);

  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Le contenu édité en back-office n'était invalidé qu'au retour du réseau.
  // Une app simplement mise en arrière-plan puis rouverte gardait donc sa copie
  // en cache : une leçon ajoutée depuis Filament n'apparaissait qu'après un
  // redémarrage complet du binaire (seul le remontage de l'écran relançait la
  // requête). Le pont `focusManager` de QueryProvider ne suffit pas : il ne
  // relance que les requêtes stale ayant un observateur actif, ce qui exclut
  // les accordéons repliés (`enabled: false`).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active' && appStateRef.current !== 'active') {
        invalidateAdminManagedQueries(queryClient);
      }
      appStateRef.current = next;
    });
    return () => sub.remove();
  }, []);

  // On attend aussi la vérification de compatibilité : sans ça, un binaire
  // obsolète afficherait brièvement l'app avant d'être remplacé par l'écran
  // bloquant. `fetchAppVersion` a un timeout de 5 s et échoue en fail-open,
  // donc cette attente est bornée.
  useEffect(() => {
    if ((loaded || error) && isHydrated && !isCheckingVersion) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error, isHydrated, isCheckingVersion]);

  // Filet de securite RUNTIME uniquement (post-login / post-logout). La
  // decision du cold-start appartient a app/index.tsx (<Redirect> declaratif,
  // resolu au render donc pre-paint) : ce guard ne touche jamais la route
  // d'entree, ce qui supprime la race index.tsx vs guard a l'origine du flash
  // d'onboarding pour un utilisateur connecte.
  useEffect(() => {
    if (!loaded || !isHydrated) return;

    // Le Stack n'est pas monté quand l'écran de mise à jour est affiché :
    // toute navigation ici viserait un arbre inexistant.
    if (mustUpdate || passwordUpgradeRequired) return;

    // ─────────────────────────────────────────────────────────────────────────
    // DEV BYPASS — set EXPO_PUBLIC_BYPASS_AUTH=true in .env.local to skip the
    // auth guard and go straight to (tabs) while building other modules.
    // This variable is absent from all non‑local env files and has zero effect
    // in staging / production builds.
    // ─────────────────────────────────────────────────────────────────────────
    if (process.env.EXPO_PUBLIC_BYPASS_AUTH === 'true') return;

    const root = segments[0];
    const inTabsGroup = root === '(tabs)';
    const inAuthGroup = root === '(auth)';
    const isLanding = root === 'landing';
    // /setup est une route racine (ni (tabs), ni (auth)) : sans cette entrée,
    // elle tombait dans le return cold-start ci-dessous et AUCUN guard ne la
    // couvrait — une session morte pendant l'onboarding laissait l'utilisateur
    // bloqué sur le choix de série avec un « Unauthenticated » sans issue.
    const isSetup = root === 'setup';

    // Cold-start (route '/' / index) : on laisse index.tsx trancher.
    if (!inTabsGroup && !inAuthGroup && !isLanding && !isSetup) return;

    if (!isAuthenticated && (inTabsGroup || isSetup)) {
      // Logout ou clearLocal (refresh token invalide) en cours de session.
      //
      // La trace distingue ce retour au landing d'un démarrage à froid, qui
      // passe lui par index.tsx et n'enregistre rien. Couplée à celle du
      // gestionnaire de 401 d'apiClient, elle dit si la session a été effacée
      // par le serveur — et sur quelle requête — ou perdue autrement.
      traceAuth(`retour au landing depuis ${isSetup ? '/setup' : 'les onglets'} : session non authentifiée`);
      router.replace('/landing');
    } else if (isAuthenticated && (inAuthGroup || isLanding)) {
      // L'écran congrats et l'onboarding nouvel utilisateur sont volontairement post-auth.
      // Sans cette exception, le guard court-circuiterait le flow inscription/Google → congrats → setup.
      // Cast : les routes typées d'Expo Router génèrent une union où certains
      // tuples n'ont qu'un élément — l'accès [1] est légitime au runtime.
      if ((segments as string[])[1] === 'congrats' || isNewUser) return;
      // Post-login : login.tsx ne navigue pas lui-meme, c'est ce guard qui
      // bascule vers (tabs) une fois setAuth() appele.
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isHydrated, isNewUser, segments, loaded, router, mustUpdate, passwordUpgradeRequired]);


  if (!loaded && !error) {
    return null;
  }

  // Court-circuite tout le reste de l'arbre : ni Stack, ni providers, ni push.
  // Un binaire incompatible ne doit émettre aucun appel API métier.
  if (mustUpdate) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ForceUpdateGate storeUrl={storeUrl} />
        <StatusBar style="dark" />
      </GestureHandlerRootView>
    );
  }

  // Même principe que la passerelle de mise à jour : on court-circuite le
  // Stack plutôt que d'ouvrir une route, qui resterait franchissable par le
  // bouton retour. QueryProvider est conservé, l'écran ayant besoin de
  // react-query et de SafeAreaProvider.
  if (isAuthenticated && passwordUpgradeRequired) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryProvider>
          <PasswordUpgradeGate />
        </QueryProvider>
        <StatusBar style="dark" />
      </GestureHandlerRootView>
    );
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
