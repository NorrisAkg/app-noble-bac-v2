import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

import { AppBar } from '@/components/ui/AppBar';
import { SubjectIcon, type SubjectKind } from '@/components/ui/SubjectIcon';
import { Heading } from '@/components/ui/Heading';
import { C } from '@/constants/theme';
import { daysUntilBac } from '@/constants/bacDates';
import { getProfile } from '@/services/profileService';

/**
 * Plan d'étude — aligné `templates/screens-plan-search.jsx:5-120`.
 *
 * **Limite backend** : pas d'endpoint `/me/study-plan` (cf.
 * `docs/BACKEND_GAPS.md` section 5.2). Les semaines et tâches sont des
 * stubs locaux dans ce fichier. À brancher quand le backend exposera
 * un plan personnalisé. Le countdown jusqu'au BAC, lui, est réel
 * (calculé via `daysUntilBac` à partir du pays du user).
 */

interface PlannedWeek {
  label: string;
  date: string;
  focus: string;
  hours: number;
  done: number; // 0..100
  current?: boolean;
}

interface PlannedTask {
  time: string;
  duration: string;
  subject: string;
  title: string;
  kind: SubjectKind;
  done?: boolean;
  current?: boolean;
}

const STUB_WEEKS: PlannedWeek[] = [
  { label: 'S1', date: '15-21 mai', focus: 'Maths · Suites & limites', hours: 8, done: 100 },
  { label: 'S2', date: '22-28 mai', focus: 'Physique · Mécanique', hours: 7, done: 100 },
  { label: 'S3', date: '29-04 juin', focus: 'SVT · Reproduction', hours: 6, done: 64, current: true },
  { label: 'S4', date: '05-11 juin', focus: 'Français · Dissertation', hours: 7, done: 0 },
  { label: 'S5', date: '12-18 juin', focus: 'Hist-Géo · 20e siècle', hours: 6, done: 0 },
  { label: 'S6', date: '19-25 juin', focus: 'Révisions blanches', hours: 10, done: 0 },
];

const STUB_TASKS_TODAY: PlannedTask[] = [
  { time: '08:30', duration: '45 min', subject: 'SVT', title: 'Quiz · Reproduction humaine', kind: 'svt', done: true },
  { time: '17:00', duration: '1h15', subject: 'Maths', title: 'Exo · Suites géométriques', kind: 'maths', current: true },
  { time: '20:30', duration: '30 min', subject: 'Français', title: 'Lecture · Méthodologie dissertation', kind: 'fr' },
];

function getTodayWeekday(): string {
  return new Date().toLocaleDateString('fr-FR', { weekday: 'long' });
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function StudyPlanScreen() {
  const insets = useSafeAreaInsets();

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    staleTime: 5 * 60 * 1000,
  });

  const daysLeft = daysUntilBac(profile?.country.code);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <AppBar title="Mon plan d'étude" />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card — countdown */}
        <LinearGradient
          colors={[C.green, C.greenDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroLabel}>BAC dans</Text>
              <Text style={styles.heroDays}>{daysLeft} jours</Text>
              <Text style={styles.heroHelper}>
                Plan calibré sur 6 semaines · 8h/sem.
              </Text>
            </View>
            <Text style={{ fontSize: 32 }}>🗓</Text>
          </View>
          <View style={styles.heroProgressTrack}>
            <View style={[styles.heroProgressFill, { width: '38%' }]} />
          </View>
          <View style={styles.heroProgressLabels}>
            <Text style={styles.heroProgressText}>38% du plan</Text>
            <Text style={styles.heroProgressText}>14h restantes cette semaine</Text>
          </View>
        </LinearGradient>

        <Heading level="h3" style={styles.sectionTitle}>
          Aujourd&apos;hui · {capitalize(getTodayWeekday())}
        </Heading>

        <View style={{ gap: 10 }}>
          {STUB_TASKS_TODAY.map((task, i) => (
            <TaskRow key={i} task={task} />
          ))}
        </View>

        <Heading level="h3" style={[styles.sectionTitle, { marginTop: 22 }]}>
          Plan sur 6 semaines
        </Heading>

        <View style={{ gap: 8 }}>
          {STUB_WEEKS.map((week) => (
            <WeekRow key={week.label} week={week} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const TaskRow: React.FC<{ task: PlannedTask }> = ({ task }) => (
  <View
    style={[
      styles.taskCard,
      task.current && styles.taskCardCurrent,
      task.done && styles.taskCardDone,
    ]}
  >
    <View style={styles.taskTimeCol}>
      <Text style={[styles.taskTime, task.current && { color: C.green }]}>{task.time}</Text>
      <Text style={styles.taskDuration}>{task.duration}</Text>
    </View>
    <View style={styles.taskSeparator} />
    <SubjectIcon kind={task.kind} size={36} />
    <View style={{ flex: 1, minWidth: 0 }}>
      <Text style={styles.taskSubject}>{task.subject}</Text>
      <Text
        style={[styles.taskTitle, task.done && styles.taskTitleDone]}
        numberOfLines={2}
      >
        {task.title}
      </Text>
    </View>
    <View style={[styles.taskCheck, task.done && styles.taskCheckDone]}>
      {task.done && (
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
          <Path
            d="M5 12 L10 17 L19 7"
            stroke="#fff"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      )}
    </View>
  </View>
);

const WeekRow: React.FC<{ week: PlannedWeek }> = ({ week }) => {
  const isDone = week.done >= 100;
  return (
    <View style={[styles.weekCard, week.current && styles.weekCardCurrent]}>
      <View
        style={[
          styles.weekBadge,
          isDone && styles.weekBadgeDone,
          week.current && !isDone && styles.weekBadgeCurrent,
        ]}
      >
        <Text
          style={[
            styles.weekBadgeText,
            isDone && { color: C.green },
            week.current && !isDone && { color: '#fff' },
          ]}
        >
          {isDone ? '✓' : week.label}
        </Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.weekFocus}>{week.focus}</Text>
        <Text style={styles.weekMeta}>
          {week.date} · {week.hours}h
        </Text>
        {week.done > 0 && week.done < 100 && (
          <View style={styles.weekProgressTrack}>
            <View style={[styles.weekProgressFill, { width: `${week.done}%` }]} />
          </View>
        )}
      </View>
      {week.current && (
        <View style={styles.weekPill}>
          <Text style={styles.weekPillText}>EN COURS</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  heroCard: {
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 22,
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 28,
    elevation: 6,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
  },
  heroDays: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 32,
    letterSpacing: -1,
    color: '#fff',
    marginTop: 2,
  },
  heroHelper: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  heroProgressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
    marginTop: 14,
  },
  heroProgressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  heroProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  heroProgressText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
  },
  sectionTitle: {
    marginBottom: 10,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: C.line,
  },
  taskCardCurrent: {
    borderWidth: 1.5,
    borderColor: C.green,
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 2,
  },
  taskCardDone: {
    opacity: 0.65,
  },
  taskTimeCol: {
    width: 56,
    alignItems: 'center',
  },
  taskTime: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: C.ink,
  },
  taskDuration: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10.5,
    color: C.ink3,
    marginTop: 1,
  },
  taskSeparator: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: C.line,
  },
  taskSubject: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: C.ink3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  taskTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: C.ink,
    marginTop: 2,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
  },
  taskCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCheckDone: {
    backgroundColor: C.green,
    borderColor: C.green,
  },
  weekCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: C.line,
  },
  weekCardCurrent: {
    borderWidth: 1.5,
    borderColor: C.green,
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 2,
  },
  weekBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekBadgeDone: {
    backgroundColor: C.greenSoft,
  },
  weekBadgeCurrent: {
    backgroundColor: C.green,
  },
  weekBadgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
    color: C.ink2,
  },
  weekFocus: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13.5,
    color: C.ink,
  },
  weekMeta: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11.5,
    color: C.ink3,
    marginTop: 2,
  },
  weekProgressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: C.line,
    overflow: 'hidden',
    marginTop: 6,
  },
  weekProgressFill: {
    height: '100%',
    backgroundColor: C.green,
  },
  weekPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: C.greenSoft,
  },
  weekPillText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10.5,
    color: C.green,
  },
});
