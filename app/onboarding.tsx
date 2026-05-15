import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Video } from 'expo-av';

// Placeholder video – you should replace the source with the actual landing video asset
// Placeholder video – you should replace the source with the actual landing video asset
const VIDEO_SOURCE = require('../assets/videos/landing-bg.mp4');

export default function LandingScreen() {
  const router = useRouter();

  const handleRegister = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      router.replace('/(tabs)'); // go to main app after onboarding
    } catch (e) {
      router.replace('/(tabs)');
    }
  };

  const handleLogin = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      // Replace with your actual login route if it exists
      router.replace('/(auth)/login');
    } catch (e) {
      router.replace('/(auth)/login');
    }
  };

  // In case the video fails to load, we keep a fallback background
  useEffect(() => {
    // Preload video or any assets if needed
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {/* Background video */}
      <Video
        source={VIDEO_SOURCE}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        shouldPlay
        isLooping
        muted
        isAudioEnabled={false}
      />
      {/* Dark gradient overlay */}
      <LinearGradient
        colors={['rgba(11,20,16,0.55)', 'rgba(11,20,16,0.30)', 'rgba(11,20,16,0.55)']}
        locations={[0, 0.35, 0.7]}
        style={StyleSheet.absoluteFill}
      />
      {/* Soft green tint */}
      <View style={styles.greenTint} />
      {/* Vignette */}
      <View style={styles.vignette} />

      {/* Buttons container */}
      <View style={styles.buttonsWrapper}>
        <TouchableOpacity onPress={handleRegister} style={styles.registerBtn} activeOpacity={0.8}>
          <Text style={styles.registerText}>Commencer</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogin} style={styles.loginBtn} activeOpacity={0.8}>
          <Text style={styles.loginText}>J'ai déjà un compte</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1410',
    position: 'relative',
  },
  greenTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(61,190,69,0.18)',
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    // radial gradient not directly supported – using opacity overlay
  },
  buttonsWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 52,
    paddingHorizontal: 28,
    flexDirection: 'column',
    gap: 12,
    alignItems: 'center',
  },
  registerBtn: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    backgroundColor: '#3DBE45',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.55,
    shadowRadius: 30,
    elevation: 8,
  },
  registerText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15.5,
    color: '#fff',
    letterSpacing: 0.2,
  },
  loginBtn: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15.5,
    color: '#fff',
    letterSpacing: 0.2,
  },
});
