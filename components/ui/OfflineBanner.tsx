import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp, FadeOut } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { X } from 'lucide-react-native';

import { useOnlineStatus } from '@/hooks/useOnlineStatus';

/**
 * Bandeau global hors-ligne — aligné `templates/screens-offline.jsx:225-268`.
 * Détecte via `useOnlineStatus` (polling `/health`). Position absolute en haut
 * de l'écran sous le notch (insets.top + 8). Disparaît dès que la connexion
 * revient ou que l'utilisateur ferme.
 */
export const OfflineBanner: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isOnline = useOnlineStatus();
  const [dismissed, setDismissed] = useState(false);

  // On reset le dismiss dès que la connexion change : si elle retombe, le
  // bandeau réapparaît la prochaine fois.
  React.useEffect(() => {
    if (isOnline) setDismissed(false);
  }, [isOnline]);

  if (isOnline || dismissed) return null;

  return (
    <Animated.View
      entering={FadeInUp.duration(260)}
      exiting={FadeOut.duration(160)}
      pointerEvents="box-none"
      style={[styles.wrapper, { top: insets.top + 8 }]}
    >
      <View style={styles.banner}>
        <View style={styles.iconBox}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path
              d="M3 8 a14 14 0 0 1 18 0 M6 11 a9 9 0 0 1 12 0 M9 14 a4 4 0 0 1 6 0 M11.5 17 h1 M3 3 L21 21"
              stroke="#fff"
              strokeWidth={1.8}
              strokeLinecap="round"
            />
          </Svg>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.title}>Tu es hors-ligne</Text>
          <Text style={styles.subtitle}>Tes contenus téléchargés restent disponibles.</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/my-downloads')}
          style={styles.cta}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>Voir</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setDismissed(true)}
          style={styles.closeBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <X size={12} color="#fff" strokeWidth={2.4} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 100,
  },
  banner: {
    backgroundColor: '#1A2027',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 8,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: '#fff',
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
  },
  cta: {
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: '#3DBE45',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    color: '#fff',
  },
  closeBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.6,
  },
});
