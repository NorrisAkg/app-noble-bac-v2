import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Modal, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Search, Bell, ChevronRight, Play } from 'lucide-react-native';
import { useAuthStore } from '@/store/useAuthStore';
import { QuickAction } from '@/components/home/QuickAction';
import { BookCover } from '@/components/home/BookCover';
import { HOME_BOOKS, type HomeBook } from '@/constants/homeBooks';

// ─── Days until BAC ──────────────────────────────────────────────────────────
function daysUntilBac(): number {
  const now = new Date();
  const year = now.getMonth() >= 5 ? now.getFullYear() + 1 : now.getFullYear();
  const bac = new Date(year, 5, 10); // June 10 (approximation)
  return Math.max(0, Math.ceil((bac.getTime() - now.getTime()) / 86_400_000));
}

// ─── Section header ──────────────────────────────────────────────────────────
const SectionHeader = ({
  title, subtitle, action, onAction,
}: {
  title: string; subtitle?: string; action?: string; onAction?: () => void;
}) => (
  <View style={styles.sectionHeader}>
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, flex: 1 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle && <Text style={styles.sectionSubtitle} numberOfLines={1}>{subtitle}</Text>}
    </View>
    {action && (
      <TouchableOpacity onPress={onAction}>
        <Text style={styles.sectionAction}>{action}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const days = useMemo(daysUntilBac, []);

  // Premium gate sheet (tapped on locked book)
  const [premiumBook, setPremiumBook] = useState<HomeBook | null>(null);

  const firstName = user?.first_name ?? 'Étudiant';
  const initials = firstName[0]?.toUpperCase() ?? 'E';
  const readyPct = 64; // Placeholder — will come from progress API

  const handleBookPress = (book: HomeBook) => {
    if (book.free) {
      // TODO: navigate to PDF reader when that module is built
      Alert.alert('Téléchargement', `"${book.title}" — bientôt disponible.`);
    } else {
      setPremiumBook(book);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
      <StatusBar style="light" />

      {/* ── HERO HEADER ────────────────────────────────────────── */}
      <View style={[styles.hero, { paddingTop: insets.top + 14 }]}>
        {/* Dot-grid decoration */}
        <View style={styles.dotGrid} pointerEvents="none">
          {Array.from({ length: 25 }).map((_, i) => (
            <View key={i} style={styles.dot} />
          ))}
        </View>

        {/* Top row: avatar + name + search + bell */}
        <View style={styles.heroTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Salut,</Text>
            <Text style={styles.heroName} numberOfLines={1}>
              {firstName} {user?.last_name ?? ''}
            </Text>
          </View>

          <TouchableOpacity style={styles.iconBtn} onPress={() => Alert.alert('Recherche', 'Bientôt disponible')}>
            <Search size={18} color="#fff" strokeWidth={1.8} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, { position: 'relative' }]} onPress={() => Alert.alert('Notifications', 'Bientôt disponible')}>
            <Bell size={18} color="#fff" strokeWidth={1.8} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>

        {/* Progress card */}
        <View style={styles.progressCard}>
          {/* Days counter */}
          <View style={styles.daysBox}>
            <Text style={styles.daysNum}>{days}</Text>
            <Text style={styles.daysLabel}>jours</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.progressTitle}>
              BAC {new Date().getFullYear() + 1}
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${readyPct}%` as any }]} />
            </View>
            <Text style={styles.progressPct}>Prêt à {readyPct} %</Text>
          </View>
        </View>
      </View>

      {/* ── SCROLLABLE BODY (overlaps hero bottom) ──────────── */}
      <ScrollView
        style={{ flex: 1, marginTop: -36 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick actions */}
        <View style={styles.quickRow}>
          <QuickAction label="Cours" icon="book" onPress={() => router.push('/(tabs)/courses')} />
          <QuickAction label="Annales" icon="paper" onPress={() => Alert.alert('Annales', 'Bientôt disponible')} />
          <QuickAction label="Premium" icon="star" accent onPress={() => Alert.alert('Premium', 'Bientôt disponible')} />
        </View>

        {/* "Reprendre" section */}
        <SectionHeader title="Reprendre" action="Tout voir" onAction={() => Alert.alert('Bibliothèque', 'Bientôt disponible')} />
        <TouchableOpacity style={styles.resumeCard} activeOpacity={0.85} onPress={() => Alert.alert('Cours', 'Bientôt disponible')}>
          <View style={styles.resumeIcon}>
            <Text style={{ fontSize: 22 }}>🇫🇷</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.resumeTitle}>Français · Dissertation littéraire</Text>
            <Text style={styles.resumeSubtitle}>Page 4 / 12</Text>
            <View style={styles.resumeTrack}>
              <View style={[styles.resumeFill, { width: '34%' }]} />
            </View>
          </View>
          <View style={styles.resumePlayBtn}>
            <ChevronRight size={14} color="#3DBE45" strokeWidth={2.4} />
          </View>
        </TouchableOpacity>

        {/* Books carousel */}
        <SectionHeader
          title="Bibliothèque"
          subtitle="Ouvrages recommandés"
          action="Voir tout"
          onAction={() => Alert.alert('Bibliothèque', 'Bientôt disponible')}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 14, paddingRight: 4 }}
          style={{ marginHorizontal: -16, paddingHorizontal: 16 }}
        >
          {HOME_BOOKS.map((b) => (
            <BookCover key={b.id} book={b} onPress={() => handleBookPress(b)} />
          ))}
        </ScrollView>
      </ScrollView>

      {/* ── PREMIUM GATE BOTTOM SHEET ────────────────────────── */}
      <Modal
        visible={!!premiumBook}
        transparent
        animationType="fade"
        onRequestClose={() => setPremiumBook(null)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setPremiumBook(null)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.sheetCard}>
            <View style={styles.sheetHandle} />

            {/* Premium badge */}
            <View style={styles.premiumBadge}>
              <Text style={{ fontSize: 12 }}>⭐</Text>
              <Text style={styles.premiumBadgeText}>Contenu Premium</Text>
            </View>

            {/* Book cover preview */}
            {premiumBook && (
              <View style={{ marginTop: 18 }}>
                <BookCover book={premiumBook} onPress={() => {}} />
              </View>
            )}

            <Text style={styles.sheetTitle}>{premiumBook?.title}</Text>
            <Text style={styles.sheetBody}>
              Débloquez la bibliothèque complète, les corrigés détaillés et tous les livres avec un abonnement Premium.
            </Text>

            {/* Features list */}
            <View style={styles.featureList}>
              {['Tous les livres et fiches', 'Corrigés des annales', 'Téléchargements hors-ligne illimités'].map((f) => (
                <View key={f} style={styles.featureRow}>
                  <View style={styles.featureCheck}>
                    <Text style={{ color: '#fff', fontSize: 10, fontFamily: 'Poppins_700Bold' }}>✓</Text>
                  </View>
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.premiumBtn} onPress={() => { setPremiumBook(null); Alert.alert('Premium', 'Bientôt disponible'); }}>
              <Text style={styles.premiumBtnText}>Voir les offres Premium</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.laterBtn} onPress={() => setPremiumBook(null)}>
              <Text style={styles.laterBtnText}>Plus tard</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Hero
  hero: {
    background: 'transparent' as any,
    backgroundColor: '#3DBE45',
    paddingHorizontal: 20,
    paddingBottom: 64,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    position: 'relative',
    overflow: 'hidden',
  },
  dotGrid: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 80,
    height: 80,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    opacity: 0.18,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#fff',
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
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: '#fff',
  },
  greeting: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
  },
  heroName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15.5,
    color: '#fff',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E8A090',
    borderWidth: 1.5,
    borderColor: '#2EA037',
  },
  progressCard: {
    marginTop: 16,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  daysBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  daysNum: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 18,
    color: '#3DBE45',
    lineHeight: 22,
    letterSpacing: -0.5,
  },
  daysLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 8,
    color: '#5A6470',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  progressTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: '#fff',
  },
  progressTrack: {
    marginTop: 6,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.28)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  progressPct: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  // Body
  quickRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    color: '#1A2027',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: '#9AA3AC',
    flexShrink: 1,
  },
  sectionAction: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: '#3DBE45',
    flexShrink: 0,
  },
  // Resume card
  resumeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 22,
    shadowColor: '#1A2027',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  resumeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  resumeTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13.5,
    color: '#1A2027',
  },
  resumeSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11.5,
    color: '#9AA3AC',
    marginTop: 2,
  },
  resumeTrack: {
    marginTop: 8,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E6E8EB',
    overflow: 'hidden',
  },
  resumeFill: {
    height: '100%',
    backgroundColor: '#3DBE45',
    borderRadius: 2,
  },
  resumePlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EAF7EB',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  // Modal / Bottom sheet
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(11,20,16,0.55)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: 36,
    alignItems: 'center',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E6E8EB',
    marginBottom: 18,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FBEDE8',
  },
  premiumBadgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
    color: '#D38576',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  sheetTitle: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 20,
    color: '#1A2027',
    letterSpacing: -0.4,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 6,
  },
  sheetBody: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: '#5A6470',
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 280,
  },
  featureList: {
    width: '100%',
    marginTop: 18,
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3DBE45',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: '#1A2027',
  },
  premiumBtn: {
    width: '100%',
    height: 54,
    marginTop: 18,
    borderRadius: 27,
    backgroundColor: '#3DBE45',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3DBE45',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 6,
  },
  premiumBtnText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    color: '#fff',
  },
  laterBtn: {
    width: '100%',
    height: 44,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  laterBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13.5,
    color: '#5A6470',
  },
});
