import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { VideoView, useVideoPlayer } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Landing Screen ──────────────────────────────────────────────────────────
// Full-bleed video background avec dégradés conformes à la maquette :
//   1. dégradé vertical foncé multi-stops (lisibilité du CTA)
//   2. tinte verte radiale (brand)
//   3. vignette centrale
//
// Au montage, on persiste `hasSeenOnboarding` pour que le RootLayout n'envoie
// plus l'utilisateur sur le landing au prochain démarrage.
//
// expo-video v3 + Fabric peut emettre "Cannot use shared object that was
// already released" si le hook useVideoPlayer et le VideoView n'ont pas le
// meme cycle de vie (race au mount / re-render). On isole donc le player +
// la view dans un sous-composant VideoBackground monte uniquement quand le
// screen est focuse, ce qui aligne strictement leurs durees de vie.

function VideoBackground() {
  const player = useVideoPlayer(require('@/assets/videos/landing-bg.mp4'), (p) => {
    p.loop = true;
    p.play();
  });

  return (
    <VideoView
      style={styles.video}
      player={player}
      nativeControls={false}
      contentFit="cover"
    />
  );
}

export default function LandingScreen() {
  const router = useRouter();
  const [isFocused, setIsFocused] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, []),
  );

  useEffect(() => {
    AsyncStorage.setItem('hasSeenOnboarding', 'true').catch(() => {
      // Silencieux : si le storage est inaccessible, l'utilisateur reverra
      // le landing au prochain démarrage. Pas critique.
    });
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {isFocused && <VideoBackground />}

      {/* 1. Dégradé vertical foncé — 4 stops pour lisibilité haut + bas */}
      <LinearGradient
        pointerEvents="none"
        colors={[
          'rgba(11,20,16,0.55)',
          'rgba(11,20,16,0.30)',
          'rgba(11,20,16,0.55)',
          'rgba(11,20,16,0.85)',
        ]}
        locations={[0, 0.35, 0.7, 1]}
        style={styles.overlay}
      />

      {/* 2. Tinte verte radiale haut-gauche — simulée par un gradient
              elliptique. expo-linear-gradient n'a pas de RadialGradient ;
              on approxime avec une translation diagonale. */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(61,190,69,0.18)', 'rgba(61,190,69,0)']}
        start={{ x: 0.3, y: 0.2 }}
        end={{ x: 0.85, y: 0.75 }}
        style={styles.overlay}
      />

      {/* 3. Vignette périphérique — assombrit les bords */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.55)']}
        locations={[0, 0.4, 1]}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 1, y: 1 }}
        style={styles.overlay}
      />

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
            <Text style={styles.btnSecondaryText}>J&apos;ai déjà un compte</Text>
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
