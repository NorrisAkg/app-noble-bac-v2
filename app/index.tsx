import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useAuthStore } from '@/store/useAuthStore';

// ─── Branded Splash Screen ───────────────────────────────────────────────────
// Shows the logo and a short animation, then navigates to the next screen.

export default function SplashScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  
  const [logoScale] = useState(new Animated.Value(0.7));
  const [logoOpacity] = useState(new Animated.Value(0));
  const [textTranslateY] = useState(new Animated.Value(10));
  const [textOpacity] = useState(new Animated.Value(0));
  const [glowScale] = useState(new Animated.Value(0.6));
  const [glowOpacity] = useState(new Animated.Value(0));

  useEffect(() => {
    // 1. Glow effect
    Animated.timing(glowScale, { toValue: 1, duration: 2000, useNativeDriver: true }).start();
    Animated.timing(glowOpacity, { toValue: 1, duration: 2000, useNativeDriver: true }).start();

    // 2. Logo in
    Animated.timing(logoScale, { toValue: 1, duration: 800, useNativeDriver: true, easing: (t) => 1 - Math.pow(1 - t, 3) }).start();
    Animated.timing(logoOpacity, { toValue: 1, duration: 800, useNativeDriver: true }).start();

    // 3. Text in (delayed)
    Animated.timing(textTranslateY, { toValue: 0, duration: 700, delay: 200, useNativeDriver: true, easing: (t) => 1 - Math.pow(1 - t, 3) }).start();
    Animated.timing(textOpacity, { toValue: 1, duration: 700, delay: 200, useNativeDriver: true }).start();

    // Navigate after sequence
    const timer = setTimeout(() => {
      // Check bypass
      if (process.env.EXPO_PUBLIC_BYPASS_AUTH === 'true') {
        router.replace('/(tabs)');
        return;
      }

      if (isAuthenticated) {
        router.replace('/(tabs)');
      } else {
        router.replace('/landing');
      }
    }, 2800);

    return () => clearTimeout(timer);
    // Animations + redirection : volontairement one-shot au mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <LinearGradient colors={['#3DBE45', '#2EA037']} style={styles.container}>
      <StatusBar style="light" />

      {/* Radial glow simulation */}
      <Animated.View style={[styles.glow, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]} />

      <View style={styles.content}>
        {/* Logo block */}
        <Animated.View style={[styles.logoBox, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={{ width: 92, height: 92 }}
            contentFit="contain"
          />
        </Animated.View>

        {/* Text block */}
        <Animated.View style={{ opacity: textOpacity, transform: [{ translateY: textTranslateY }], alignItems: 'center' }}>
          <Text style={styles.title}>Le Noble BAC</Text>
          <Text style={styles.subtitle}>UEMOA</Text>
        </Animated.View>
      </View>

      {/* Loading indicator */}
      <View style={styles.loader}>
        <ActivityDot delay={0} />
        <ActivityDot delay={160} />
        <ActivityDot delay={320} />
      </View>
    </LinearGradient>
  );
}

// Bouncing dot for loader
const ActivityDot = ({ delay }: { delay: number }) => {
  const [scale] = useState(new Animated.Value(0.85));
  const [opacity] = useState(new Animated.Value(0.35));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.15, duration: 400, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 400, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.85, duration: 400, useNativeDriver: true }),
      ])
    );
    
    const timer = setTimeout(() => loop.start(), delay);
    return () => {
      clearTimeout(timer);
      loop.stop();
    };
    // Boucle d'animation : doit démarrer une seule fois au mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <Animated.View style={[styles.dot, { opacity, transform: [{ scale }] }]} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3DBE45',
  },
  glow: {
    position: 'absolute',
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
  },
  logoBox: {
    width: 132,
    height: 132,
    borderRadius: 36,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.35,
    shadowRadius: 50,
    elevation: 10,
  },
  title: {
    marginTop: 28,
    fontFamily: 'Poppins_700Bold',
    fontSize: 30,
    color: '#fff',
    letterSpacing: -0.4,
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 14,
  },
  subtitle: {
    marginTop: 4,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 6,
    textTransform: 'uppercase',
  },
  loader: {
    position: 'absolute',
    bottom: 64,
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
});
