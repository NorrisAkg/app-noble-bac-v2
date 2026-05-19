import React from 'react';
import { Text, StyleSheet, Modal, Pressable, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

import { C } from '@/constants/theme';

interface PremiumSuccessSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Sheet plein écran « Tu es Premium ! » — aligné
 * `templates/screens-premium.jsx:32-68`. Affiché après confirmation
 * d'un paiement réussi. Le checkmark est animé via Reanimated
 * (`ZoomIn` 600ms damping 12), le contenu via `FadeIn` 400ms.
 */
export const PremiumSuccessSheet: React.FC<PremiumSuccessSheetProps> = ({
  isOpen,
  onClose,
}) => (
  <Modal
    visible={isOpen}
    transparent={false}
    animationType="fade"
    onRequestClose={onClose}
  >
    <LinearGradient
      colors={[C.green, C.greenDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <Animated.View
        entering={ZoomIn.duration(600).springify().damping(12)}
        style={styles.checkCircle}
      >
        <Svg width={56} height={56} viewBox="0 0 24 24" fill="none">
          <Path
            d="M5 12 L10 17 L19 7"
            stroke="#fff"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Animated.View>

      <Animated.View entering={FadeIn.delay(200).duration(400)}>
        <Text style={styles.title}>Tu es Premium !</Text>
        <Text style={styles.desc}>
          Profite de toutes les fonctionnalités jusqu&apos;au BAC.{'\n'}Bonne révision !
        </Text>
      </Animated.View>

      <Animated.View entering={FadeIn.delay(400).duration(400)} style={{ marginTop: 32 }}>
        <Pressable onPress={onClose} style={({ pressed }) => [
          styles.cta,
          pressed && { opacity: 0.85 },
        ]}>
          <Text style={styles.ctaText}>Commencer</Text>
        </Pressable>
      </Animated.View>

      {/* Filler bas pour centrer le contenu */}
      <View style={{ height: 80 }} />
    </LinearGradient>
  </Modal>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  checkCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    color: '#fff',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  desc: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14.5,
    color: 'rgba(255,255,255,0.92)',
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 12,
    maxWidth: 280,
  },
  cta: {
    height: 52,
    paddingHorizontal: 36,
    borderRadius: 26,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    color: C.green,
  },
});
