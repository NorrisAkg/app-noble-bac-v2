import React, { useEffect, useMemo, useState } from 'react';
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
import { X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';

import { getActiveSubscription, getSubscriptionPlans } from '@/services/subscriptionService';
import { initiatePayment } from '@/services/paymentService';
import { getApiErrorMessage } from '@/utils/apiError';
import { C } from '@/constants/theme';
import type { SubscriptionPlan } from '@/types/api';

interface Perk {
  icon: string;
  title: string;
  desc: string;
}

const PERKS: Perk[] = [
  {
    icon: '✨',
    title: 'Tuteur IA illimité',
    desc: 'Pose toutes tes questions, sans limite quotidienne.',
  },
  {
    icon: '📄',
    title: 'Tous les sujets',
    desc: 'Accès aux 8 pays UEMOA, 10 dernières années.',
  },
  {
    icon: '🎯',
    title: 'Quiz adaptatifs',
    desc: 'L’app cible tes faiblesses pour te faire progresser plus vite.',
  },
  {
    icon: '📺',
    title: 'Vidéos de cours',
    desc: 'Plus de 200 vidéos de profs partenaires.',
  },
  {
    icon: '⬇️',
    title: 'Mode hors-ligne',
    desc: 'Télécharge sujets et corrigés pour réviser sans connexion.',
  },
];

function formatPrice(priceFcfa: number): string {
  return new Intl.NumberFormat('fr-FR').format(priceFcfa);
}

function pickRecommendedIndex(plans: SubscriptionPlan[]): number {
  if (plans.length === 0) return -1;
  if (plans.length === 1) return 0;
  // Le plan « POPULAIRE » de la maquette correspond au trimestriel (90 jours).
  const trimestriel = plans.findIndex((p) => p.duration_days === 90);
  if (trimestriel !== -1) return trimestriel;
  // Fallback : 2ème plan si présent.
  return Math.min(1, plans.length - 1);
}

export default function SubscriptionPlansScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [isInitiating, setIsInitiating] = useState(false);

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

  const plans = useMemo(() => plansQuery.data ?? [], [plansQuery.data]);
  const recommendedIdx = useMemo(() => pickRecommendedIndex(plans), [plans]);

  // Sélection par défaut au premier rendu : le plan recommandé.
  useEffect(() => {
    if (selectedPlanId === null && plans.length > 0) {
      setSelectedPlanId(plans[recommendedIdx >= 0 ? recommendedIdx : 0].id);
    }
  }, [plans, selectedPlanId, recommendedIdx]);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) ?? null;
  const activeSub = activeQuery.data;
  const userHasActiveSub = activeSub?.status === 'active';

  const handleContinue = async () => {
    if (!selectedPlan || isInitiating) return;
    setIsInitiating(true);
    try {
      const { transaction, payment_url } = await initiatePayment(selectedPlan.id);
      router.push({
        pathname: '/payment-checkout',
        params: {
          transaction_id: String(transaction.id),
          payment_url: encodeURIComponent(payment_url),
        },
      });
    } catch (e) {
      Alert.alert('Paiement', getApiErrorMessage(e, 'Impossible de démarrer le paiement.'));
    } finally {
      setIsInitiating(false);
    }
  };

  const isLoading = plansQuery.isLoading;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Hero gradient — aligné `templates/screens-premium.jsx:175-197` */}
      <LinearGradient
        colors={[C.green, C.greenDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + 12 }]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeBtn}
          activeOpacity={0.85}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <X size={16} color="#fff" strokeWidth={2.4} />
        </TouchableOpacity>
        <Text style={styles.heroEmoji}>🏆</Text>
        <Text style={styles.heroTitle}>Passe Premium</Text>
        <Text style={styles.heroSubtitle}>Débloque tout pour réussir ton BAC.</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 130 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* PERKS — 5 lignes avec tile vert clair + emoji */}
        <View style={styles.perks}>
          {PERKS.map((p) => (
            <View key={p.title} style={styles.perkRow}>
              <View style={styles.perkTile}>
                <Text style={styles.perkEmoji}>{p.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.perkTitle}>{p.title}</Text>
                <Text style={styles.perkDesc}>{p.desc}</Text>
              </View>
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

        <Text style={styles.sectionTitle}>Choisis ta formule</Text>

        {isLoading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={C.green} />
          </View>
        ) : plans.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateText}>Aucun plan disponible pour le moment.</Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {plans.map((plan, idx) => (
              <PlanRow
                key={plan.id}
                plan={plan}
                active={plan.id === selectedPlanId}
                best={idx === recommendedIdx}
                onPress={() => setSelectedPlanId(plan.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* CTA fixe en bas — aligné maquette */}
      {selectedPlan && (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            onPress={handleContinue}
            disabled={isInitiating}
            activeOpacity={0.85}
            style={[styles.cta, isInitiating && styles.ctaDisabled]}
          >
            {isInitiating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.ctaText}>
                Continuer · {formatPrice(selectedPlan.price_fcfa)} {selectedPlan.currency}
              </Text>
            )}
          </TouchableOpacity>
          <Text style={styles.footerLegal}>
            Annulable à tout moment · Paiement sécurisé
          </Text>
        </View>
      )}
    </View>
  );
}

interface PlanRowProps {
  plan: SubscriptionPlan;
  active: boolean;
  best: boolean;
  onPress: () => void;
}

const PlanRow: React.FC<PlanRowProps> = ({ plan, active, best, onPress }) => (
  <TouchableOpacity
    activeOpacity={0.85}
    onPress={onPress}
    style={[styles.planRow, active && styles.planRowActive]}
  >
    {/* Radio */}
    <View style={[styles.radio, active && styles.radioActive]}>
      {active && <View style={styles.radioDot} />}
    </View>

    <View style={{ flex: 1 }}>
      <View style={styles.planTitleRow}>
        <Text style={styles.planLabel}>{plan.label}</Text>
        {best && (
          <View style={styles.bestBadge}>
            <Text style={styles.bestBadgeText}>POPULAIRE</Text>
          </View>
        )}
      </View>
      <Text style={styles.planDesc}>
        {plan.duration_days} jours d’accès
      </Text>
    </View>

    <View style={{ alignItems: 'flex-end' }}>
      <Text style={styles.planPrice}>{formatPrice(plan.price_fcfa)}</Text>
      <Text style={styles.planPeriod}>
        {plan.currency} / {plan.duration_days}j
      </Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  hero: {
    paddingHorizontal: 14,
    paddingBottom: 28,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  heroEmoji: {
    fontSize: 36,
    marginBottom: 4,
  },
  heroTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 26,
    color: '#fff',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  perks: {
    gap: 12,
    marginBottom: 22,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  perkTile: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perkEmoji: {
    fontSize: 16,
  },
  perkTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: C.ink,
  },
  perkDesc: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12.5,
    color: C.ink2,
    marginTop: 1,
  },
  activeBanner: {
    backgroundColor: C.greenSoft,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: C.green,
    marginBottom: 16,
  },
  activeBannerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
    color: C.ink,
  },
  activeBannerLink: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: C.green,
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: C.ink,
    marginBottom: 10,
  },
  stateBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  stateText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: C.ink2,
  },
  planRow: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.line,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  planRowActive: {
    borderColor: C.green,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: C.green,
    backgroundColor: C.green,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planLabel: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14.5,
    color: C.ink,
  },
  bestBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: C.salmon,
  },
  bestBadgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
    color: '#fff',
    letterSpacing: 0.6,
  },
  planDesc: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11.5,
    color: C.ink3,
    marginTop: 2,
  },
  planPrice: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: C.ink,
    letterSpacing: -0.3,
  },
  planPeriod: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10.5,
    color: C.ink3,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 12,
    paddingHorizontal: 20,
    backgroundColor: C.bg,
  },
  cta: {
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
  ctaDisabled: {
    opacity: 0.7,
  },
  ctaText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: '#fff',
    letterSpacing: 0.2,
  },
  footerLegal: {
    marginTop: 10,
    textAlign: 'center',
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: C.ink3,
  },
});
