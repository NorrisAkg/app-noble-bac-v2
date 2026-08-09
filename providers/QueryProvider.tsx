import NetInfo from "@react-native-community/netinfo";
import { focusManager, onlineManager, QueryClient } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import React from "react";
import { AppState, Platform, type AppStateStatus } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

const DAY_MS = 1000 * 60 * 60 * 24;

/**
 * Durée de conservation du cache persisté. Doit rester alignée sur `gcTime` :
 * le persister applique son propre `maxAge` (défaut 24 h) et jetait donc tout
 * le cache offline bien avant les 15 jours annoncés par `gcTime`.
 */
const PERSIST_MAX_AGE = DAY_MS * 15;

/**
 * Change le `buster` du persister à chaque version d'app. Sans lui, un binaire
 * qui modifie la forme d'un payload réhydrate quand même l'ancien cache. Pas
 * d'expo-updates ici : la version du binaire est la seule frontière de schéma.
 */
const CACHE_BUSTER = `v${Constants.expoConfig?.version ?? "0"}`;

/**
 * React Query ne détecte ni le focus ni la connectivité tout seul en React
 * Native : sans ces deux ponts, `refetchOnWindowFocus` et
 * `refetchOnReconnect` (tous deux `true` par défaut) ne se déclenchent JAMAIS
 * sur mobile. Une app mise en arrière-plan sans être tuée ne rafraîchissait
 * donc plus rien — seul le remontage d'un écran ou un pull-to-refresh manuel
 * sortait du cache, ce qui laissait le contenu édité en admin invisible
 * pendant des heures. En dev sur Metro le bug était masqué : chaque reload
 * remonte tout l'arbre.
 *
 * Ces deux abonnements sont installés au niveau module, avant tout rendu, pour
 * qu'aucune requête ne démarre sans eux.
 */
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected && state.isInternetReachable !== false);
  }),
);

AppState.addEventListener("change", (status: AppStateStatus) => {
  if (Platform.OS !== "web") {
    focusManager.setFocused(status === "active");
  }
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,        // 5 min — fenêtre "fresh" en ligne
      gcTime: DAY_MS * 15,             // 15 jours — survit aux redémarrages
      networkMode: "offlineFirst",       // sert le cache sans tenter le réseau
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "NOBLE_BAC_QUERY_CACHE",
  throttleTime: 1000,
});

export { queryClient };

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: PERSIST_MAX_AGE, buster: CACHE_BUSTER }}
    >
      <SafeAreaProvider>{children}</SafeAreaProvider>
    </PersistQueryClientProvider>
  );
}
