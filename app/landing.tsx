import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { VideoView, useVideoPlayer } from 'expo-video';

// ─── Landing Screen ──────────────────────────────────────────────────────────
// Full-bleed video background with a dark gradient overlay and CTAs.

export default function LandingScreen() {
  const router = useRouter();

  const player = useVideoPlayer(require('@/assets/videos/landing-bg.mp4'), player => {
    player.loop = true;
    player.play();
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Video Background */}
      <VideoView
        style={styles.video}
        player={player}
        nativeControls={false}
        contentFit="cover"
      />

      {/* Dark gradient overlay for legibility (simulated via overlapping views) */}
      <View style={[styles.overlay, { backgroundColor: 'rgba(11,20,16,0.3)' }]} />
      
      {/* Soft green tint */}
      <View style={[styles.overlay, { backgroundColor: 'rgba(61,190,69,0.08)' }]} />

      <View style={styles.content}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.btnPrimary}
            activeOpacity={0.85}
            onPress={() => router.push('/(auth)/signup')}
          >
            <Text style={styles.btnPrimaryText}>Commencer</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.btnSecondary}
            activeOpacity={0.85}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.btnSecondaryText}>J'ai déjà un compte</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1410',
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 28,
    paddingBottom: 52,
    zIndex: 2,
  },
  buttonContainer: {
    gap: 12,
  },
  btnPrimary: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    backgroundColor: '#3DBE45',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3DBE45',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.55,
    shadowRadius: 30,
    elevation: 8,
  },
  btnPrimaryText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15.5,
    color: '#fff',
    letterSpacing: 0.2,
  },
  btnSecondary: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15.5,
    color: '#fff',
    letterSpacing: 0.2,
  },
});
