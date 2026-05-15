import React, { useEffect } from 'react';
import { View, Image, StyleSheet, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Placeholder logo – replace with actual asset
// Placeholder logo – using icon.png as it exists in assets/images
const LOGO = require('../assets/images/icon.png');

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const seen = await AsyncStorage.getItem('hasSeenOnboarding');
        if (seen === 'true') {
          router.replace('/(tabs)');
        } else {
          router.replace('/onboarding');
        }
      } catch (e) {
        router.replace('/onboarding');
      }
    }, 2500); // 2.5s splash for better feel
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#3DBE45', '#2A9B33']}
        style={styles.gradient}
      />
      {/* Soft ambient glow */}
      <View style={styles.glow} />
      
      <View style={styles.logoWrapper}>
        <Animated.View entering={FadeInUp.duration(800).springify()}>
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />
        </Animated.View>
        <View style={styles.titleWrapper}>
          <AnimatedText text="Le Noble BAC" />
          <AnimatedText text="UEMOA" small />
        </View>
      </View>

      {/* Loader dots */}
      <View style={styles.loader}>
        {[0, 1, 2].map(i => (
          <Dot key={i} delay={i * 200} />
        ))}
      </View>
    </View>
  );
}

// Animated Dot component
import Animated, { FadeInUp, useAnimatedStyle, withRepeat, withTiming, withSequence, useSharedValue, withDelay } from 'react-native-reanimated';

const Dot = ({ delay }: { delay: number }) => {
  const opacity = useSharedValue(0.3);
  
  useEffect(() => {
    opacity.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0.3, { duration: 400 })
      ),
      -1,
      true
    ));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: opacity.value }]
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
};

const AnimatedText = ({ text, small }: { text: string; small?: boolean }) => (
  <Animated.Text
    entering={FadeInUp.duration(700).delay(small ? 400 : 300)}
    style={small ? styles.subTitle : styles.title}
  >
    {text}
  </Animated.Text>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3DBE45',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  glow: {
    position: 'absolute',
    top: '20%',
    left: '50%',
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: 'rgba(255,255,255,0.25)',
    transform: [{ translateX: -210 }, { translateY: -210 }],
  },
  logoWrapper: {
    alignItems: 'center',
    zIndex: 1,
  },
  logo: {
    width: 132,
    height: 132,
    borderRadius: 36,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    marginBottom: 10,
  },
  titleWrapper: {
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 30,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 14,
    marginTop: 28,
  },
  subTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 6,
    textTransform: 'uppercase',
    marginTop: 4,
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
    // simple pulse animation via reanimated is omitted for brevity
  },
});
