import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import {
  Settings,
  Bell,
  ShieldCheck,
  HelpCircle,
  LogOut,
  ChevronRight,
  Trophy,
  Target,
  Clock,
  Award,
  Download,
} from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';
import { useAuthStore } from '@/store/useAuthStore';
import { getProfile } from '@/services/profileService';
import type { UserProfile } from '@/types/api';

/**
 * Concatene les initiales (max 2 chars) en majuscules.
 * Robuste aux prenoms composes ("Awa Marie" -> "AM").
 */
function getInitials(firstName: string | undefined, lastName: string | undefined): string {
  const first = firstName?.trim().charAt(0).toUpperCase() ?? '';
  const last = lastName?.trim().charAt(0).toUpperCase() ?? '';
  return `${first}${last}` || '?';
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const fallbackUser = useAuthStore((s) => s.user);

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: getProfile,
    staleTime: 5 * 60 * 1000,
  });

  // Bascule vers le profile complet des qu'il est dispo, sinon fallback sur
  // le user minimal (id/first_name/last_name/phone) deja en SecureStore.
  const displayName =
    profile != null
      ? `${profile.first_name} ${profile.last_name}`
      : fallbackUser != null
        ? `${fallbackUser.first_name} ${fallbackUser.last_name}`
        : '...';

  const initials =
    profile != null
      ? getInitials(profile.first_name, profile.last_name)
      : getInitials(fallbackUser?.first_name, fallbackUser?.last_name);

  // Meta pays + serie : disponible uniquement depuis le profile complet.
  const userMeta =
    profile != null
      ? `${profile.country.name} · Terminale ${profile.series.label}`
      : isLoading
        ? 'Chargement...'
        : '';

  // TODO M-P2.7 / M-P3 : stats utilisateur (quiz faits, score moyen, temps d'etude)
  //   et badges ne sont pas encore exposes par le backend. Conservation des
  //   slots UI avec '—' pour ne pas casser le rendu — a brancher quand un
  //   endpoint /me/stats existera.
  const stats = [
    { label: 'Quiz faits', value: '—', icon: Target, color: '#3DBE45' },
    { label: 'Réussite', value: '—', icon: Trophy, color: '#FFB800' },
    { label: "Temps d'étude", value: '—', icon: Clock, color: '#E8A090' },
  ];

  const badges = [
    { id: 1, name: 'Premier Pas', icon: '🌱' },
    { id: 2, name: 'Savant', icon: '🧠' },
    { id: 3, name: 'Assidu', icon: '🔥' },
    { id: 4, name: 'Major', icon: '🎓' },
  ];

  const menuItems = [
    { id: 'edit', label: 'Modifier le profil', icon: Settings, route: '/settings/edit-profile' },
    { id: 'downloads', label: 'Mes téléchargements', icon: Download, route: '/my-downloads' },
    { id: 'notif', label: 'Notifications', icon: Bell, route: '/settings/notifications' },
    { id: 'support', label: 'Support & Aide', icon: HelpCircle, route: '/settings/support' },
    { id: 'privacy', label: 'Confidentialité', icon: ShieldCheck, route: '/settings/privacy' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header with Background */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <TouchableOpacity style={styles.editAvatarBtn}>
              <Award size={14} color="#3DBE45" strokeWidth={3} />
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{displayName}</Text>
          {userMeta.length > 0 && <Text style={styles.userMeta}>{userMeta}</Text>}

          {profile?.is_premium === true && (
            <TouchableOpacity style={styles.premiumBadge}>
              <Text style={styles.premiumText}>MEMBRE PREMIUM</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && profile == null && (
          <View style={styles.loaderRow}>
            <ActivityIndicator color="#3DBE45" />
          </View>
        )}

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat, i) => (
            <Animated.View
              key={stat.label}
              entering={FadeInUp.delay(i * 100)}
              style={styles.statCard}
            >
              <View style={[styles.statIconContainer, { backgroundColor: stat.color + '15' }]}>
                <stat.icon size={20} color={stat.color} strokeWidth={2.5} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </Animated.View>
          ))}
        </View>

        {/* Badges Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes Badges</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>Voir tout</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.badgesScroll}
        >
          {badges.map((badge, i) => (
            <Animated.View
              key={badge.id}
              entering={FadeInRight.delay(400 + i * 100)}
              style={styles.badgeCard}
            >
              <Text style={styles.badgeIcon}>{badge.icon}</Text>
              <Text style={styles.badgeName}>{badge.name}</Text>
            </Animated.View>
          ))}
        </ScrollView>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, i === menuItems.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => router.push(item.route as any)}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconContainer}>
                  <item.icon size={20} color="#5A6470" />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <ChevronRight size={18} color="#D5DAE0" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={() => logout()}>
          <LogOut size={20} color="#E14B36" />
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#3DBE45',
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 32,
    color: '#3DBE45',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: '#fff',
    marginBottom: 4,
  },
  userMeta: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 12,
  },
  premiumBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  premiumText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
    color: '#fff',
    letterSpacing: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: -20,
  },
  loaderRow: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#fff',
    width: '31%',
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#1A2027',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: '#1A2027',
  },
  statLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: '#9AA3AC',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: '#1A2027',
  },
  seeAllText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#3DBE45',
  },
  badgesScroll: {
    gap: 12,
    paddingRight: 20,
    marginBottom: 24,
  },
  badgeCard: {
    backgroundColor: '#fff',
    width: 80,
    height: 100,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A2027',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  badgeIcon: {
    fontSize: 30,
    marginBottom: 4,
  },
  badgeName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    color: '#5A6470',
    textAlign: 'center',
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#1A2027',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#1A2027',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  logoutText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: '#E14B36',
  },
});
