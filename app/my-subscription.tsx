import React from 'react';
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
import { useRouter } from 'expo-router';
import { ChevronLeft, CheckCircle2, Clock, XCircle, AlertTriangle, Crown } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';

import { getActiveSubscription, getTransactions } from '@/services/subscriptionService';
import type { PaymentTransaction, SubscriptionStatus, TransactionStatus } from '@/types/api';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatAmount(fcfa: number, currency: string): string {
  return `${new Intl.NumberFormat('fr-FR').format(fcfa)} ${currency}`;
}

function daysRemaining(expiresAt: string | null): number {
  if (!expiresAt) return 0;
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

function statusLabel(status: SubscriptionStatus): string {
  return { active: 'Actif', expired: 'Expiré', cancelled: 'Annulé' }[status];
}

function txStatusLabel(s: TransactionStatus): string {
  return { pending: 'En attente', confirmed: 'Confirmé', failed: 'Échoué', expired: 'Expiré' }[s];
}

function txStatusColor(s: TransactionStatus): string {
  return {
    pending: '#FFB800',
    confirmed: '#3DBE45',
    failed: '#E14B36',
    expired: '#9AA3AC',
  }[s];
}

function txStatusIcon(s: TransactionStatus) {
  switch (s) {
    case 'confirmed':
      return CheckCircle2;
    case 'pending':
      return Clock;
    case 'failed':
      return XCircle;
    case 'expired':
      return AlertTriangle;
  }
}

export default function MySubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const activeQuery = useQuery({
    queryKey: ['active-subscription'],
    queryFn: getActiveSubscription,
    staleTime: 60 * 1000,
  });

  const txQuery = useQuery({
    queryKey: ['subscription-transactions'],
    queryFn: () => getTransactions({ page: 1, per_page: 20 }),
    staleTime: 60 * 1000,
  });

  const sub = activeQuery.data;
  const transactions = txQuery.data?.data ?? [];

  const refreshing = activeQuery.isRefetching || txQuery.isRefetching;
  const refetchAll = () => {
    activeQuery.refetch();
    txQuery.refetch();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={{ height: insets.top, backgroundColor: '#3DBE45' }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mon abonnement</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refetchAll} tintColor="#3DBE45" />}
      >
        {/* Carte abonnement actif */}
        {activeQuery.isLoading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color="#3DBE45" />
          </View>
        ) : sub == null ? (
          <View style={styles.noSubCard}>
            <Crown size={36} color="#FFB800" strokeWidth={2.2} />
            <Text style={styles.noSubTitle}>Pas encore Premium</Text>
            <Text style={styles.noSubSubtitle}>
              Souscris à un abonnement pour débloquer les corrigés, vidéos et téléchargements hors-ligne.
            </Text>
            <TouchableOpacity
              style={styles.ctaBtn}
              activeOpacity={0.85}
              onPress={() => router.push('/subscription-plans')}
            >
              <Text style={styles.ctaBtnText}>Voir les offres</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ActiveSubCard
            status={sub.status}
            label={sub.plan?.label ?? 'Abonnement'}
            startedAt={sub.started_at}
            expiresAt={sub.expires_at}
            daysLeft={daysRemaining(sub.expires_at)}
            onChange={() => router.push('/subscription-plans')}
          />
        )}

        <Text style={styles.sectionTitle}>Historique de paiements</Text>

        {txQuery.isLoading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color="#3DBE45" />
          </View>
        ) : transactions.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={styles.emptyText}>Aucune transaction pour le moment.</Text>
          </View>
        ) : (
          <View style={styles.txList}>
            {transactions.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

interface ActiveSubCardProps {
  status: SubscriptionStatus;
  label: string;
  startedAt: string | null;
  expiresAt: string | null;
  daysLeft: number;
  onChange: () => void;
}

const ActiveSubCard: React.FC<ActiveSubCardProps> = ({
  status,
  label,
  startedAt,
  expiresAt,
  daysLeft,
  onChange,
}) => {
  const isActive = status === 'active';
  return (
    <View style={[styles.subCard, !isActive && styles.subCardInactive]}>
      <View style={styles.subCardHead}>
        <View style={styles.subCardBadge}>
          <Text style={styles.subCardBadgeText}>{statusLabel(status).toUpperCase()}</Text>
        </View>
        <Crown size={20} color={isActive ? '#FFB800' : '#9AA3AC'} strokeWidth={2.2} />
      </View>
      <Text style={styles.subCardLabel}>{label}</Text>
      {isActive && (
        <Text style={styles.subCardCountdown}>
          {daysLeft > 0 ? `${daysLeft} jours restants` : 'Dernier jour'}
        </Text>
      )}
      <View style={styles.subDates}>
        <View style={styles.subDateBlock}>
          <Text style={styles.subDateLabel}>Début</Text>
          <Text style={styles.subDateValue}>{formatDate(startedAt)}</Text>
        </View>
        <View style={styles.subDateBlock}>
          <Text style={styles.subDateLabel}>Expiration</Text>
          <Text style={styles.subDateValue}>{formatDate(expiresAt)}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.subCardCta} activeOpacity={0.85} onPress={onChange}>
        <Text style={styles.subCardCtaText}>
          {isActive ? 'Voir les autres offres' : 'Réactiver mon abonnement'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const TransactionRow: React.FC<{ tx: PaymentTransaction }> = ({ tx }) => {
  const Icon = txStatusIcon(tx.status);
  const color = txStatusColor(tx.status);
  return (
    <View style={styles.txRow}>
      <View style={[styles.txIconWrap, { backgroundColor: color + '15' }]}>
        <Icon size={18} color={color} strokeWidth={2.2} />
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txTitle}>{tx.plan?.label ?? 'Plan inconnu'}</Text>
        <Text style={styles.txMeta}>
          {formatDate(tx.created_at)} · {tx.internal_reference}
        </Text>
      </View>
      <View style={styles.txAmountCol}>
        <Text style={styles.txAmount}>{formatAmount(tx.amount_fcfa, tx.currency)}</Text>
        <Text style={[styles.txStatus, { color }]}>{txStatusLabel(tx.status)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    height: 64,
    backgroundColor: '#3DBE45',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Poppins_700Bold', fontSize: 17, color: '#fff' },
  content: { flex: 1, paddingHorizontal: 16 },

  stateBox: { paddingVertical: 32, alignItems: 'center' },
  emptyText: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: '#5A6470' },

  noSubCard: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#1A2027',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  noSubTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 17,
    color: '#1A2027',
    marginTop: 10,
  },
  noSubSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: '#5A6470',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  ctaBtn: {
    marginTop: 16,
    height: 44,
    paddingHorizontal: 32,
    borderRadius: 22,
    backgroundColor: '#3DBE45',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtnText: { fontFamily: 'Poppins_700Bold', fontSize: 14, color: '#fff' },

  subCard: {
    marginTop: 20,
    backgroundColor: '#3DBE45',
    borderRadius: 18,
    padding: 18,
  },
  subCardInactive: { backgroundColor: '#9AA3AC' },
  subCardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  subCardBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  subCardBadgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
    color: '#fff',
    letterSpacing: 0.8,
  },
  subCardLabel: { fontFamily: 'Poppins_700Bold', fontSize: 22, color: '#fff' },
  subCardCountdown: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  subDates: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 24,
  },
  subDateBlock: { gap: 2 },
  subDateLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
  },
  subDateValue: { fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: '#fff' },
  subCardCta: {
    marginTop: 16,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subCardCtaText: { fontFamily: 'Poppins_700Bold', fontSize: 13, color: '#fff' },

  sectionTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: '#1A2027',
    marginTop: 22,
    marginBottom: 12,
  },

  txList: { gap: 8 },
  txRow: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#1A2027',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  txIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: { flex: 1 },
  txTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: '#1A2027' },
  txMeta: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: '#9AA3AC', marginTop: 2 },
  txAmountCol: { alignItems: 'flex-end' },
  txAmount: { fontFamily: 'Poppins_700Bold', fontSize: 13, color: '#1A2027' },
  txStatus: { fontFamily: 'Poppins_600SemiBold', fontSize: 10, marginTop: 2 },
});
