import React from 'react';
import { View, Text, Linking, Alert } from 'react-native';
import { ArrowUpCircle } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { getCurrentAppVersion } from '@/services/appVersionService';

interface ForceUpdateGateProps {
  storeUrl: string | null;
}

/**
 * Écran bloquant affiché quand le binaire installé est plus ancien que la
 * version minimale supportée par l'API.
 *
 * Rendu en amont du `<Stack>` d'expo-router plutôt qu'en tant que route : une
 * route resterait franchissable via le bouton retour matériel ou une deep link,
 * alors que le point de cet écran est précisément d'être sans issue.
 */
export function ForceUpdateGate({ storeUrl }: ForceUpdateGateProps) {
  const openStore = () => {
    if (!storeUrl) return;
    Linking.openURL(storeUrl).catch(() => {
      Alert.alert(
        'Impossible d\'ouvrir le store',
        'Recherche « Noble BAC UEMOA » manuellement dans le Play Store.',
      );
    });
  };

  return (
    <View className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-8">
        <View className="w-[88px] h-[88px] rounded-full bg-brand-green/10 items-center justify-center mb-7">
          <ArrowUpCircle size={44} color="#3DBE45" />
        </View>

        <Text className="font-poppins-bold text-2xl text-brand-ink text-center tracking-tighter">
          Mise à jour requise
        </Text>

        <Text className="font-poppins text-sm text-brand-ink-medium text-center mt-3 leading-5">
          Cette version de l&apos;application n&apos;est plus compatible avec nos serveurs.
          Installe la dernière version pour continuer à réviser.
        </Text>

        {storeUrl ? (
          <View className="w-full mt-9">
            <Button onPress={openStore}>Mettre à jour</Button>
          </View>
        ) : (
          <Text className="font-poppins text-[13px] text-brand-ink-medium text-center mt-9">
            Recherche « Noble BAC UEMOA » dans le Play Store.
          </Text>
        )}

        <Text className="font-poppins text-[12px] text-brand-ink-medium/70 mt-6">
          Version installée : {getCurrentAppVersion()}
        </Text>
      </View>
    </View>
  );
}
