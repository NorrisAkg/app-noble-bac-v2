import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

interface HomeSkeletonProps {
  /** Inset haut (safe area) pour aligner le hero sur l'écran réel. */
  topInset: number;
}

/**
 * Skeleton plein écran de l'accueil, affiché uniquement au premier
 * chargement à froid (aucune donnée en cache). Ne mime que les blocs
 * permanents — hero, carte « Reprendre », section Bibliothèque — pour ne
 * pas promettre de bloc conditionnel (quiz du jour, pubs, citations) qui
 * pourrait être absent au reveal. Les dimensions reprennent celles des
 * vrais composants (avatar 44, carte countdown, covers 116×156).
 */
export const HomeSkeleton: React.FC<HomeSkeletonProps> = ({ topInset }) => {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(0.45, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View style={[{ flex: 1 }, pulseStyle]}>
      {/* Hero */}
      <View style={[styles.hero, { paddingTop: topInset + 14 }]}>
        <View style={styles.heroTop}>
          <View style={styles.avatar} />
          <View style={{ flex: 1, gap: 7 }}>
            <View style={[styles.heroLine, { width: 56 }]} />
            <View style={[styles.heroLine, { width: 140, height: 12 }]} />
          </View>
          <View style={styles.iconCircle} />
          <View style={styles.iconCircle} />
        </View>

        <View style={styles.progressCard}>
          <View style={styles.daysBox} />
          <View style={{ flex: 1, gap: 8 }}>
            <View style={[styles.heroLine, { width: '70%', height: 11 }]} />
            <View style={[styles.heroLine, { width: '100%', height: 5 }]} />
            <View style={[styles.heroLine, { width: '45%', height: 9 }]} />
          </View>
        </View>
      </View>

      {/* Carte « Reprendre » */}
      <View style={styles.resumeBand}>
        <View style={styles.resumeCard}>
          <View style={styles.resumeIcon} />
          <View style={{ flex: 1, gap: 8 }}>
            <View style={[styles.bodyLine, { width: 72, height: 9 }]} />
            <View style={[styles.bodyLine, { width: '80%', height: 12 }]} />
            <View style={[styles.bodyLine, { width: '100%', height: 4 }]} />
          </View>
          <View style={styles.resumePlayBtn} />
        </View>
      </View>

      {/* Section Bibliothèque */}
      <View style={styles.body}>
        <View style={styles.sectionHeader}>
          <View style={[styles.bodyLine, { width: 110, height: 14 }]} />
          <View style={[styles.bodyLine, { width: 52, height: 11 }]} />
        </View>
        <View style={styles.bookRow}>
          {Array.from({ length: 3 }).map((_, i) => (
            <View key={i} style={{ gap: 8 }}>
              <View style={styles.bookCover} />
              <View style={[styles.bodyLine, { width: 96, height: 11 }]} />
              <View style={[styles.bodyLine, { width: 64, height: 9 }]} />
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
};

const HERO_SHAPE = 'rgba(255,255,255,0.28)';
const BODY_SHAPE = '#E6E8EB';

const styles = StyleSheet.create({
  hero: {
    backgroundColor: '#3DBE45',
    paddingHorizontal: 20,
    paddingBottom: 64,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: HERO_SHAPE,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: HERO_SHAPE,
  },
  heroLine: {
    height: 10,
    borderRadius: 5,
    backgroundColor: HERO_SHAPE,
  },
  progressCard: {
    marginTop: 16,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  daysBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: HERO_SHAPE,
    flexShrink: 0,
  },
  resumeBand: {
    marginTop: -36,
    paddingHorizontal: 16,
    paddingBottom: 14,
    zIndex: 5,
  },
  resumeCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  resumeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: BODY_SHAPE,
    flexShrink: 0,
  },
  resumePlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BODY_SHAPE,
    flexShrink: 0,
  },
  bodyLine: {
    borderRadius: 5,
    backgroundColor: BODY_SHAPE,
  },
  body: {
    padding: 16,
    paddingTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  bookRow: {
    flexDirection: 'row',
    gap: 14,
  },
  bookCover: {
    width: 116,
    height: 156,
    borderRadius: 6,
    backgroundColor: BODY_SHAPE,
  },
});
