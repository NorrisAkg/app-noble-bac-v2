import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ChevronLeft, Check, Crown } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';

import { getActiveSubscription, getSubscriptionPlans } from '@/services/subscriptionService';
import { initiatePayment } from '@/services/paymentService';
import { getApiErrorMessage } from '@/utils/apiError';
import type { SubscriptionPlan } from '@/types/api';

const PLAN_FEATURES = [
  'Tous les corrigés d’épreuves',
  'Vidéos commentées',
  'Téléchargements hors-ligne (500 Mo / 90j)',
  'Quiz illimités',
];

function formatPrice(priceFcfa: number): string {
  return new Intl.NumberFormat('fr-FR').format(priceFcfa);
}

function pricePerDay(plan: SubscriptionPlan): string {
  const ratio = Math.round(plan.price_fcfa / plan.duration_days);
  return `${formatPrice(ratio)} FCFA / jour`;
}

export default function SubscriptionPlansScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [initiatingPlanId, setInitiatingPlanId] = useState<number | null>(null);

  const plansQuery = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: getSubscriptionPlans,
    staleTime: 10 * 60 * 1000,
  });

  const activeQuery = useQuery({
    queryKey: ['active-subscription'],
    queryFn: getActiveSubscription,
    staleTime: 60 * 1000,
  });

  const handleChoose = async (plan: SubscriptionPlan) => {
    if (initiatingPlanId !== null) return;
    setInitiatingPlanId(plan.id);
    try {
      const { transaction, payment_url } = await initiatePayment(plan.id);
      router.push({
        pathname: '/payment-checkout',
        params: {
          transaction_id: String(transaction.id),
          payment_url: encodeURIComponent(payment_url),
        },
      });
    } catch (e) {
      Alert.alert('Paiement', getApiErrorMessage(e, 'Impossible de demarrer le paiement.'));
    } finally {
      setInitiatingPlanId(null);
    }
  };

  const isLoading = plansQuery.isLoading;
  const plans = plansQuery.data ?? [];
  const activeSub = activeQuery.data;
  const userHasActiveSub = activeSub?.status === 'active';

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={{ height: insets.top, backgroundColor: '#3DBE45' }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Premium</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.crownWrap}>
            <Crown size={28} color="#FFB800" strokeWidth={2.4} />
          </View>
          <Text style={styles.heroTitle}>Débloque tout le contenu</Text>
          <Text style={styles.heroSubtitle}>
            Annales, corrigés, vidéos commentées, fiches de révision et téléchargements hors-ligne.
          </Text>
        </View>

        <View style={styles.featuresBox}>
          {PLAN_FEATURES.map((f) => (
            <View key={f} style={styles.featureRow}>
              <View style={styles.featureCheck}>
                <Check size={12} color="#fff" strokeWidth={3} />
              </View>
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        {userHasActiveSub && (
          <View style={styles.activeBanner}>
            <Text style={styles.activeBannerTitle}>Tu as déjà un abonnement actif</Text>
            <TouchableOpacity onPress={() => router.replace('/my-subscription')}>
              <Text style={styles.activeBannerLink}>Voir mon abonnement →</Text>
            </TouchableOpacity>
          </View>
        )}

        {isLoading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color="#3DBE45" />
          </View>
        ) : plans.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateText}>Aucun plan disponible pour le moment.</Text>
          </View>
        ) : (
          <View style={styles.plansList}>
            {plans.map((plan, idx) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onChoose={() => handleChoose(plan)}
                highlight={idx === 1}
                isInitiating={initiatingPlanId === plan.id}
              />
            ))}
          </View>
        )}

        <Text style={styles.legal}>
          Le paiement Mobile Money (CinetPay) sera activé à l’étape suivante. L’abonnement démarre dès la confirmation du paiement et se renouvelle uniquement sur demande.
        </Text>
      </ScrollView>
    </View>
  );
}

interface PlanCardProps {
  plan: SubscriptionPlan;
  onChoose: () => void;
  highlight: boolean;
  isInitiating: boolean;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, onChoose, highlight, isInitiating }) => (
  <View style={[styles.planCard, highlight && styles.planCardHighlight]}>
    {highlight && (
      <View style={styles.bestBadge}>
        <Text style={styles.bestBadgeText}>RECOMMANDÉ</Text>
      </View>
    )}
    <Text style={styles.planLabel}>{plan.label}</Text>
    <Text style={styles.planDuration}>{plan.duration_days} jours d’accès</Text>
    <View style={styles.priceRow}>
      <Text style={styles.priceValue}>{formatPrice(plan.price_fcfa)}</Text>
      <Text style={styles.priceCurrency}>{plan.currency}</Text>
    </View>
    <Text style={styles.pricePerDay}>{pricePerDay(plan)}</Text>
    <TouchableOpacity
      style={[styles.chooseBtn, highlight && styles.chooseBtnHighlight, isInitiating && styles.chooseBtnDisabled]}
      onPress={onChoose}
      activeOpacity={0.85}
      disabled={isInitiating}
    >
      {isInitiating ? (
        <ActivityIndicator size="small" color={highlight ? '#fff' : '#3DBE45'} />
      ) : (
        <Text style={[styles.chooseBtnText, highlight && styles.chooseBtnTextHighlight]}>
          Choisir ce plan
        </Text>
      )}
    </TouchableOpacity>
  </View>
);

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

  hero: { alignItems: 'center', paddingTop: 24, paddingBottom: 16 },
  crownWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 184, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: { fontFamily: 'Poppins_700Bold', fontSize: 20, color: '#1A2027', textAlign: 'center' },
  heroSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: '#5A6470',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 16,
    lineHeight: 18,
  },

  featuresBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    gap: 10,
    shadowColor: '#1A2027',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#3DBE45',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: '#1A2027', flex: 1 },

  activeBanner: {
    marginTop: 16,
    backgroundColor: '#EAF7EB',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#3DBE45',
  },
  activeBannerTitle: { fontFamily: 'Poppins_700Bold', fontSize: 13, color: '#1A2027' },
  activeBannerLink: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#3DBE45',
    marginTop: 4,
  },

  stateBox: { paddingVertical: 40, alignItems: 'center' },
  stateText: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: '#5A6470' },

  plansList: { marginTop: 16, gap: 12 },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#1A2027',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  planCardHighlight: { borderWidth: 2, borderColor: '#3DBE45' },
  bestBadge: {
    position: 'absolute',
    top: -10,
    right: 14,
    backgroundColor: '#FFB800',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bestBadgeText: { fontFamily: 'Poppins_700Bold', fontSize: 9, color: '#1A2027', letterSpacing: 0.6 },
  planLabel: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: '#1A2027' },
  planDuration: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#9AA3AC', marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 12 },
  priceValue: { fontFamily: 'Poppins_700Bold', fontSize: 28, color: '#3DBE45' },
  priceCurrency: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#3DBE45' },
  pricePerDay: { fontFamily: 'Poppins_500Medium', fontSize: 11, color: '#9AA3AC', marginTop: 2 },

  chooseBtn: {
    marginTop: 14,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#3DBE45',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chooseBtnHighlight: { backgroundColor: '#3DBE45', borderColor: '#3DBE45' },
  chooseBtnDisabled: { opacity: 0.7 },
  chooseBtnText: { fontFamily: 'Poppins_700Bold', fontSize: 13, color: '#3DBE45' },
  chooseBtnTextHighlight: { color: '#fff' },

  legal: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: '#9AA3AC',
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 8,
    lineHeight: 16,
  },
});
