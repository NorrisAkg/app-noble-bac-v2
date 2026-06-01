import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,        // 5 min — fenêtre "fresh" en ligne
      gcTime: 1000 * 60 * 60 * 24 * 7, // 7 jours — survit aux redémarrages
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
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
      <SafeAreaProvider>{children}</SafeAreaProvider>
    </PersistQueryClientProvider>
  );
}
