import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, type Href } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronRight,
  LogOut,
  Settings,
  Globe2,
  Bell,
  HelpCircle,
  ShieldCheck,
  Wallet,
  Download,
  MessageCircle,
  Trash2,
  Crown,
} from 'lucide-react-native';

import { useAuthStore } from '@/store/useAuthStore';
import { AppBar } from '@/components/ui/AppBar';
import { WhatsAppSheet } from '@/components/ui/WhatsAppSheet';
import { getProfile } from '@/services/profileService';
import { getMeStats } from '@/services/meService';
import { C } from '@/constants/theme';
import type { UserProfile } from '@/types/api';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  iconColor: string;
  iconBg: string;
  onPress: () => void;
  danger?: boolean;
}

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

  const [whatsappOpen, setWhatsappOpen] = useState(false);

  const profileQuery = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: getProfile,
    staleTime: 5 * 60 * 1000,
  });
  const profile = profileQuery.data;
  const isLoading = profileQuery.isLoading;

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

  const userMeta =
    profile != null
      ? `Bac ${profile.series.label} · ${profile.country.name}`
      : isLoading
        ? 'Chargement...'
        : '';

  // Stats agrégées via /me/stats (UserStatsService, cache 60s backend).
  // Aligné maquette : `screens-library.jsx:378-390` (3 stats compactes dans
  // une seule card avec séparateurs verticaux).
  const statsQuery = useQuery({
    queryKey: ['me', 'stats'],
    queryFn: getMeStats,
    staleTime: 5 * 60 * 1000,
  });
  const meStats = statsQuery.data;
  const stats = [
    { label: 'Quiz', value: meStats ? String(meStats.quiz_count) : '—' },
    { label: 'Score', value: meStats ? `${meStats.average_score_pct}%` : '—' },
    { label: 'Sujets', value: meStats ? String(meStats.exams_consulted) : '—' },
  ];

  const openWhatsApp = () => {
    setWhatsappOpen(true);
  };

  const menuItems: MenuItem[] = [
    {
      id: 'edit',
      label: 'Modifier le profil',
      icon: Settings,
      iconColor: C.green,
      iconBg: C.greenSoft,
      onPress: () => router.push('/settings/edit-profile' as Href),
    },
    {
      id: 'series',
      label: 'Pays et série',
      icon: Globe2,
      iconColor: C.green,
      iconBg: C.greenSoft,
      onPress: () => router.push('/setup' as Href),
    },
    {
      id: 'notif',
      label: 'Notifications',
      icon: Bell,
      iconColor: C.salmonDark,
      iconBg: C.salmonSoft,
      onPress: () => router.push('/settings/notifications' as Href),
    },
    {
      id: 'downloads',
      label: 'Hors-ligne',
      icon: Download,
      iconColor: C.green,
      iconBg: C.greenSoft,
      onPress: () => router.push('/my-downloads' as Href),
    },
    {
      id: 'subscription',
      label: 'Mes paiements',
      icon: Wallet,
      iconColor: C.salmonDark,
      iconBg: C.salmonSoft,
      onPress: () => router.push('/my-subscription' as Href),
    },
    {
      id: 'whatsapp',
      label: 'Chaîne WhatsApp',
      icon: MessageCircle,
      iconColor: C.green,
      iconBg: C.greenSoft,
      onPress: openWhatsApp,
    },
    {
      id: 'support',
      label: 'Support',
      icon: HelpCircle,
      iconColor: C.salmonDark,
      iconBg: C.salmonSoft,
      onPress: () => router.push('/settings/support' as Href),
    },
    {
      id: 'privacy',
      label: 'Politique de confidentialité',
      icon: ShieldCheck,
      iconColor: C.green,
      iconBg: C.greenSoft,
      onPress: () => router.push('/settings/privacy' as Href),
    },
    {
      id: 'delete',
      label: 'Supprimer mon compte',
      icon: Trash2,
      iconColor: C.danger,
      iconBg: C.dangerSoft,
      onPress: () => router.push('/settings/delete-account' as Href),
      danger: true,
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <AppBar title="Profil" />

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={profileQuery.isRefetching || statsQuery.isRefetching}
            onRefresh={() => {
              profileQuery.refetch();
              statsQuery.refetch();
            }}
            tintColor={C.green}
          />
        }
      >
        {isLoading && profile == null && (
          <View style={styles.loaderRow}>
            <ActivityIndicator color={C.green} />
          </View>
        )}

        {/* En-tête utilisateur — avatar gradient à gauche, nom + meta + chip
            Premium à droite. Aligné `screens-library.jsx:341-375`. */}
        <View style={styles.userRow}>
          <LinearGradient
            colors={[C.green, C.greenDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {displayName}
            </Text>
            {userMeta.length > 0 && <Text style={styles.userMeta}>{userMeta}</Text>}
            {profile?.is_premium === true ? (
              <TouchableOpacity
                style={styles.premiumChip}
                onPress={() => router.push('/my-subscription' as Href)}
                activeOpacity={0.85}
              >
                <Crown size={11} color={C.salmonDark} strokeWidth={2.4} />
                <Text style={styles.premiumChipText}>Premium</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.upgradeChip}
                onPress={() => router.push('/subscription-plans' as Href)}
                activeOpacity={0.85}
              >
                <Crown size={11} color={C.salmonDark} strokeWidth={2.4} />
                <Text style={styles.upgradeChipText}>Devenir Premium</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Stats : une seule card avec 3 colonnes + séparateurs verticaux.
            Aligné `screens-library.jsx:378-390`. */}
        <View style={styles.statsCard}>
          {stats.map((stat, i) => (
            <React.Fragment key={stat.label}>
              {i > 0 && <View style={styles.statsSeparator} />}
              <View style={styles.statsItem}>
                <Text style={styles.statsValue}>{stat.value}</Text>
                <Text style={styles.statsLabel}>{stat.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* Menu items — icônes colorées (greenSoft / salmonSoft / dangerSoft)
            au lieu d'icônes Lucide grises uniformes. */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, i === menuItems.length - 1 && { borderBottomWidth: 0 }]}
              onPress={item.onPress}
              activeOpacity={0.6}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconContainer, { backgroundColor: item.iconBg }]}>
                  <item.icon size={18} color={item.iconColor} strokeWidth={2.2} />
                </View>
                <Text style={[styles.menuLabel, item.danger && { color: C.danger }]}>
                  {item.label}
                </Text>
              </View>
              <ChevronRight size={18} color={C.handle} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Bouton logout — pleine largeur, border salmonSoft, fond blanc */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => logout()}
          activeOpacity={0.85}
        >
          <LogOut size={18} color={C.danger} strokeWidth={2.2} />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>

      <WhatsAppSheet
        isOpen={whatsappOpen}
        onClose={() => setWhatsappOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  loaderRow: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: '#fff',
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: C.ink,
    letterSpacing: -0.3,
  },
  userMeta: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12.5,
    color: C.ink2,
  },
  premiumChip: {
    alignSelf: 'flex-start',
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.salmonSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  premiumChipText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10.5,
    color: C.salmonDark,
    letterSpacing: 0.4,
  },
  upgradeChip: {
    alignSelf: 'flex-start',
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.salmonSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  upgradeChipText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10.5,
    color: C.salmonDark,
    letterSpacing: 0.3,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    flexDirection: 'row',
    paddingVertical: 14,
    marginBottom: 18,
    shadowColor: C.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 1,
  },
  statsItem: {
    flex: 1,
    alignItems: 'center',
  },
  statsValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: C.ink,
    letterSpacing: -0.4,
  },
  statsLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: C.ink3,
    marginTop: 2,
  },
  statsSeparator: {
    width: 1,
    backgroundColor: C.line,
    marginVertical: 4,
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 14,
    marginBottom: 20,
    shadowColor: C.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: C.ink,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#F5D9D1',
  },
  logoutText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: C.danger,
  },
});
