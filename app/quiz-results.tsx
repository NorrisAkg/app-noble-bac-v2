import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { X } from 'lucide-react-native';

import { C } from '@/constants/theme';
import { useQuizStore } from '@/store/useQuizStore';

interface Tier {
  label: string;
  color: string;
  emoji: string;
}

/**
 * Calcule le palier (tier) en fonction du pourcentage de bonnes réponses.
 * Aligné `templates/screens-results-detail.jsx:19-22`.
 */
function getTier(pct: number): Tier {
  if (pct >= 80) return { label: 'Excellent !', color: C.green, emoji: '🏆' };
  if (pct >= 60) return { label: 'Bien joué', color: C.green, emoji: '⭐' };
  if (pct >= 40) return { label: 'Continue', color: C.salmon, emoji: '💪' };
  return { label: 'Reprends calmement', color: C.salmon, emoji: '📚' };
}

/**
 * Formate des secondes en `m:ss` (ex. 168 → '2:48').
 */
function formatDuration(secs: number | null): string {
  if (secs === null || Number.isNaN(secs)) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const CIRCLE_RADIUS = 56;
const CIRCLE_STROKE = 10;
const SVG_SIZE = 160;
const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

export default function QuizResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { score = '0', total = '0' } = useLocalSearchParams<{ score?: string; total?: string }>();

  const finishedSession = useQuizStore((s) => s.lastFinishedSession);

  const numericScore = Number(score);
  const numericTotal = Number(total);
  const pct = numericTotal > 0 ? Math.round((numericScore / numericTotal) * 100) : 0;
  const tier = getTier(pct);

  const subjectName = finishedSession?.subject?.name ?? 'Quiz';
  const durationLabel = formatDuration(finishedSession?.duration_seconds ?? null);
  const errors = Math.max(0, numericTotal - numericScore);

  // Animation du compteur (0 → score). On reproduit le tick de 80ms du template.
  const [animScore, setAnimScore] = useState(0);
  useEffect(() => {
    if (numericScore === 0) {
      setAnimScore(0);
      return;
    }
    let cur = 0;
    const id = setInterval(() => {
      cur += 1;
      if (cur >= numericScore) {
        setAnimScore(numericScore);
        clearInterval(id);
      } else {
        setAnimScore(cur);
      }
    }, 80);
    return () => clearInterval(id);
  }, [numericScore]);

  const dash = numericTotal > 0
    ? CIRCUMFERENCE * (animScore / numericTotal)
    : 0;

  return (
    <LinearGradient
      colors={[C.greenSoft, C.bg]}
      locations={[0, 0.5]}
      style={styles.container}
    >
      <StatusBar style="dark" />
      <View style={{ height: insets.top }} />

      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/quiz')}
          style={styles.closeBtn}
          activeOpacity={0.7}
        >
          <X size={16} color={C.ink} strokeWidth={2.4} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.emoji}>{tier.emoji}</Text>

        <Text style={[styles.tierLabel, { color: tier.color }]}>{tier.label}</Text>

        <Text style={styles.subjectLine}>
          {subjectName} · Quiz terminé
        </Text>

        <View style={styles.circleWrap}>
          <Svg width={SVG_SIZE} height={SVG_SIZE}>
            <Circle
              cx={SVG_SIZE / 2}
              cy={SVG_SIZE / 2}
              r={CIRCLE_RADIUS}
              stroke={C.line}
              strokeWidth={CIRCLE_STROKE}
              fill="none"
            />
            <Circle
              cx={SVG_SIZE / 2}
              cy={SVG_SIZE / 2}
              r={CIRCLE_RADIUS}
              stroke={tier.color}
              strokeWidth={CIRCLE_STROKE}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
              transform={`rotate(-90 ${SVG_SIZE / 2} ${SVG_SIZE / 2})`}
            />
          </Svg>
          <View style={styles.circleCenter} pointerEvents="none">
            <Text style={styles.circleScore}>
              {animScore}
              <Text style={styles.circleTotal}>/{numericTotal}</Text>
            </Text>
            <Text style={[styles.circlePct, { color: tier.color }]}>
              {numericTotal > 0 ? Math.round((animScore / numericTotal) * 100) : 0}%
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatBox value={`${numericScore}`} label="Justes" color={C.green} />
          <StatBox value={`${errors}`} label="Erreurs" color={C.salmonDark} />
          <StatBox value={durationLabel} label="Temps" color={C.ink} />
        </View>

        <View style={styles.comparisonCard}>
          <Text style={styles.comparisonEmoji}>📈</Text>
          <Text style={styles.comparisonText}>
            Continue à pratiquer pour grimper dans le classement de ta série.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/quiz')}
          style={styles.primaryBtn}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>Nouveau quiz</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/quiz-review')}
          style={styles.ghostBtn}
          activeOpacity={0.85}
        >
          <Text style={styles.ghostBtnText}>Voir les corrections</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

interface StatBoxProps {
  value: string;
  label: string;
  color: string;
}

const StatBox: React.FC<StatBoxProps> = ({ value, label, color }) => (
  <View style={styles.statBox}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 56,
    marginTop: 8,
  },
  tierLabel: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    letterSpacing: -0.5,
    marginTop: 8,
    textAlign: 'center',
  },
  subjectLine: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: C.ink2,
    marginTop: 4,
    textAlign: 'center',
  },
  circleWrap: {
    position: 'relative',
    width: SVG_SIZE,
    height: SVG_SIZE,
    marginVertical: 24,
  },
  circleCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleScore: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 38,
    color: C.ink,
    letterSpacing: -1,
  },
  circleTotal: {
    fontFamily: 'Poppins_500Medium',
    color: C.ink3,
    fontSize: 22,
  },
  circlePct: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginTop: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    shadowColor: C.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  statValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    letterSpacing: -0.4,
  },
  statLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10.5,
    color: C.ink3,
    marginTop: 2,
  },
  comparisonCard: {
    marginTop: 16,
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: C.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 1,
  },
  comparisonEmoji: {
    fontSize: 24,
  },
  comparisonText: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12.5,
    color: C.ink2,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 10,
  },
  primaryBtn: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    backgroundColor: C.green,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 6,
  },
  primaryBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: '#fff',
    letterSpacing: 0.2,
  },
  ghostBtn: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: C.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: C.green,
    letterSpacing: 0.2,
  },
});
