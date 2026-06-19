import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { ChevronLeft, Smartphone } from 'lucide-react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { getOperators, getCountries } from '@/services/referentialService';
import { initiatePayment, getPaymentStatus } from '@/services/paymentService';
import { getApiErrorMessage, getValidationErrors } from '@/utils/apiError';
import { displayCurrency } from '@/utils/currency';
import { PremiumSuccessSheet } from '@/components/ui/PremiumSuccessSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthStore } from '@/store/useAuthStore';
import { C } from '@/constants/theme';
import type { Operator, TransactionStatus } from '@/types/api';

/**
 * Intervalle entre deux polls de statut. FedaPay confirme generalement en
 * ~10-30s apres validation utilisateur. 4s est un compromis charge/UX.
 */
const POLL_INTERVAL_MS = 4_000;

/**
 * Borne haute du polling (en cas de webhook bloque, on n'attend pas
 * indefiniment). 5 min couvre largement le temps d'un paiement Mobile Money.
 */
const POLL_TIMEOUT_MS = 5 * 60 * 1_000;

/** Format E.164 attendu par le backend (E164PhoneRule). */
const E164_RE = /^\+[1-9]\d{7,14}$/;

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(amount);
}

export default function PaymentCheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { plan_id, plan_label, plan_amount, plan_currency } = useLocalSearchParams<{
    plan_id?: string;
    plan_label?: string;
    plan_amount?: string;
    plan_currency?: string;
  }>();

  const planId = plan_id ? Number(plan_id) : null;
  const planAmount = plan_amount ? Number(plan_amount) : 0;
  const planCurrency = plan_currency ?? 'XOF';

  const [selectedOperatorId, setSelectedOperatorId] = useState<number | null>(null);
  const [localPhone, setLocalPhone] = useState<string>('');
  const [step, setStep] = useState<'select' | 'processing'>('select');
  // true = checkout hébergé (page FedaPay ouverte) ; false = débit direct (USSD).
  const [hostedCheckout, setHostedCheckout] = useState(true);
  const [transactionId, setTransactionId] = useState<number | null>(null);
  const [status, setStatus] = useState<TransactionStatus>('pending');
  const [showSuccessSheet, setShowSuccessSheet] = useState(false);
  const finishedRef = useRef(false);
  const startedAtRef = useRef<number>(0);

  const operatorsQuery = useQuery({
    queryKey: ['operators', user?.country_id],
    queryFn: () => getOperators(user!.country_id),
    enabled: !!user?.country_id,
    staleTime: 10 * 60 * 1000,
  });

  // Le pays de paiement est celui du compte (les operateurs y sont rattaches) :
  // on en deduit l'indicatif, affiche en lecture seule. L'utilisateur ne tape
  // que la partie locale, ce qui evite les erreurs de format E.164.
  const countriesQuery = useQuery({
    queryKey: ['countries'],
    queryFn: getCountries,
    staleTime: 24 * 60 * 60 * 1000,
  });

  const userCountry = countriesQuery.data?.find(
    (c) => String(c.id) === String(user?.country_id),
  );
  const phonePrefix = userCountry?.phone_code ?? '';

  // Pre-remplit le numero local a partir du telephone du profil (E.164) en
  // retirant l'indicatif, des que le pays est connu.
  useEffect(() => {
    if (!phonePrefix || !user?.phone) return;
    setLocalPhone((prev) =>
      prev.length > 0
        ? prev
        : user.phone.startsWith(phonePrefix)
          ? user.phone.slice(phonePrefix.length)
          : '',
    );
  }, [phonePrefix, user?.phone]);

  const operators = operatorsQuery.data ?? [];
  const localDigits = localPhone.replace(/\D/g, '');
  const fullPhone = phonePrefix + localDigits;
  const phoneValid = phonePrefix.length > 0 && E164_RE.test(fullPhone);
  const canPay = selectedOperatorId !== null && phoneValid && !!planId;

  // Bloque le bouton retour materiel pendant le traitement pour eviter de
  // claquer l'ecran entre la validation operateur et la confirmation webhook.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });
    return () => sub.remove();
    // handleBack capture les refs/state au moment du clic ; mount-only suffit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Polling du statut une fois le paiement initie. S'arrete des qu'on quitte
  // 'pending' ou apres POLL_TIMEOUT_MS.
  useEffect(() => {
    if (transactionId === null) return;

    const interval = setInterval(async () => {
      if (finishedRef.current) return;

      if (Date.now() - startedAtRef.current > POLL_TIMEOUT_MS) {
        finishedRef.current = true;
        clearInterval(interval);
        Alert.alert(
          'Paiement en cours',
          'La confirmation prend plus de temps que prevu. Tu peux verifier le statut dans "Mon abonnement".',
          [{ text: 'OK', onPress: () => router.replace('/my-subscription') }],
        );
        return;
      }

      try {
        const tx = await getPaymentStatus(transactionId);
        if (tx.status === 'confirmed') {
          finishedRef.current = true;
          clearInterval(interval);
          await queryClient.invalidateQueries({ queryKey: ['subscription', 'active'] });
          await queryClient.invalidateQueries({ queryKey: ['active-subscription'] });
          await queryClient.invalidateQueries({ queryKey: ['profile'] });
          await queryClient.invalidateQueries({ queryKey: ['my-subscription-transactions'] });
          setStatus('confirmed');
          setShowSuccessSheet(true);
        } else if (tx.status === 'failed' || tx.status === 'expired') {
          finishedRef.current = true;
          clearInterval(interval);
          setStatus(tx.status);
          setStep('select');
          Alert.alert(
            'Paiement non abouti',
            tx.status === 'expired'
              ? 'Le delai de paiement a expire. Reessaie.'
              : 'Le paiement a echoue. Aucun montant n\'a ete debite.',
          );
        }
      } catch (e) {
        // Erreur reseau ponctuelle : on retentera au prochain tick.
        console.warn('[payment-checkout] poll status failed:', getApiErrorMessage(e));
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [transactionId, queryClient, router]);

  const handleBack = () => {
    if (step !== 'processing' || finishedRef.current) {
      router.back();
      return;
    }
    Alert.alert(
      'Annuler le paiement ?',
      'Si tu as deja confirme cote operateur, la transaction sera traitee en arriere-plan.',
      [
        { text: 'Continuer le paiement', style: 'cancel' },
        {
          text: 'Quitter',
          style: 'destructive',
          onPress: () => {
            finishedRef.current = true;
            router.back();
          },
        },
      ],
    );
  };

  const handlePay = async () => {
    if (!canPay || planId === null || selectedOperatorId === null) return;
    finishedRef.current = false;
    startedAtRef.current = Date.now();
    setStep('processing');
    try {
      const { transaction, payment_url } = await initiatePayment({
        subscriptionPlanId: planId,
        operatorId: selectedOperatorId,
        phoneNumber: fullPhone,
      });
      // Démarre le polling avant tout : la confirmation peut arriver pendant
      // que la page FedaPay est ouverte / que l'USSD est en cours.
      setTransactionId(transaction.id);
      setHostedCheckout(!!payment_url);
      if (payment_url) {
        // Mode hébergé : ouvre la page FedaPay. La promesse se résout à la
        // fermeture du navigateur ; le polling prend alors le relais.
        await WebBrowser.openBrowserAsync(payment_url);
      }
      // Mode débit direct (payment_url null) : le push USSD a déjà été envoyé
      // côté backend, le polling détecte la confirmation.
    } catch (e) {
      setStep('select');
      const validationErrors = getValidationErrors(e);
      if (validationErrors.phone_number) {
        // Seul champ saisi par l'utilisateur : on remonte un message actionnable.
        Alert.alert('Numéro invalide', validationErrors.phone_number);
      } else if (Object.keys(validationErrors).length > 0) {
        // Offre / operateur invalides : non corrigeables cote utilisateur
        // (champs pilotes par l'app). On logue le detail technique pour le
        // diagnostic et on affiche un message generique, jamais le message
        // brut du backend ("subscription plan id est invalide", etc.).
        console.warn('[payment-checkout] validation backend:', validationErrors);
        Alert.alert(
          'Paiement indisponible',
          'Impossible de démarrer le paiement pour le moment. Réessaie dans un instant ou contacte le support.',
        );
      } else {
        // Erreur passerelle (502) ou reseau : message backend deja lisible.
        Alert.alert('Paiement', getApiErrorMessage(e, 'Impossible de démarrer le paiement.'));
      }
    }
  };

  if (planId === null) {
    return (
      <View style={styles.container}>
        <View style={{ height: insets.top, backgroundColor: C.green }} />
        <Header onBack={() => router.back()} />
        <View style={styles.stateBox}>
          <Text style={styles.errorText}>
            Offre invalide. Reviens à l&apos;écran Premium et réessaie.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={{ height: insets.top, backgroundColor: C.green }} />
      <Header onBack={handleBack} />

      {step === 'processing' ? (
        <View style={styles.processingBox}>
          <ActivityIndicator size="large" color={C.green} />
          <Text style={styles.processingTitle}>
            {hostedCheckout ? 'Finalise ton paiement' : 'Confirme sur ton téléphone'}
          </Text>
          <Text style={styles.processingDesc}>
            {hostedCheckout
              ? "Termine le paiement dans la page qui s'est ouverte. Une fois validé, reviens sur cet écran : la confirmation est automatique. Ne ferme pas cet écran."
              : 'Une demande de paiement a été envoyée à ton numéro. Valide-la avec ton code mobile money pour activer ton abonnement. Ne ferme pas cet écran.'}
          </Text>
          {status !== 'pending' && status !== 'confirmed' && (
            <Text style={styles.statusText}>
              Statut : {status === 'expired' ? 'Expiré' : 'Échoué'}
            </Text>
          )}
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={insets.top + 64}
        >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Récap plan */}
          <View style={styles.planCard}>
            <View>
              <Text style={styles.planCardLabel}>Plan {plan_label ?? ''}</Text>
              <Text style={styles.planCardPrice}>
                {formatPrice(planAmount)}{' '}
                <Text style={styles.planCardCurrency}>{displayCurrency(planCurrency)}</Text>
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.modifyLink}>Modifier</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Choisis ton mode de paiement</Text>

          {operatorsQuery.isLoading ? (
            <View style={styles.stateBox}>
              <ActivityIndicator color={C.green} />
            </View>
          ) : operators.length === 0 ? (
            <EmptyState
              icon={Smartphone}
              title="Aucun opérateur disponible"
              description="Le paiement mobile money n'est pas encore disponible dans ton pays. Réessaie plus tard."
            />
          ) : (
            <View style={styles.operatorsList}>
              {operators.map((op) => (
                <OperatorRow
                  key={op.id}
                  operator={op}
                  active={op.id === selectedOperatorId}
                  onPress={() => setSelectedOperatorId(op.id)}
                />
              ))}
            </View>
          )}

          {selectedOperatorId !== null && (
            <View style={styles.phoneBlock}>
              <Text style={styles.fieldLabel}>Numéro à débiter</Text>
              <View style={styles.phoneRow}>
                <View style={styles.prefixBox}>
                  <Text style={styles.prefixFlag}>{userCountry?.flag_emoji ?? '🌍'}</Text>
                  <Text style={styles.prefixText}>{phonePrefix || '…'}</Text>
                </View>
                <TextInput
                  style={[
                    styles.phoneInput,
                    styles.phoneInputFlex,
                    localPhone.length > 0 && !phoneValid && styles.phoneInputError,
                  ]}
                  value={localPhone}
                  onChangeText={setLocalPhone}
                  placeholder="07 00 00 00 00"
                  placeholderTextColor={C.ink3}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                />
              </View>
              {localPhone.length > 0 && !phoneValid && (
                <Text style={styles.fieldError}>Numéro invalide pour {userCountry?.name ?? 'ce pays'}.</Text>
              )}
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  Tu vas recevoir une demande sur ton téléphone pour confirmer le paiement.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
        </KeyboardAvoidingView>
      )}

      {step === 'select' && operators.length > 0 && (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            onPress={handlePay}
            disabled={!canPay}
            activeOpacity={0.85}
            style={[styles.cta, !canPay && styles.ctaDisabled]}
          >
            <Text style={styles.ctaText}>
              Payer {formatPrice(planAmount)} {displayCurrency(planCurrency)}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <PremiumSuccessSheet
        isOpen={showSuccessSheet}
        onClose={() => {
          setShowSuccessSheet(false);
          router.replace('/my-subscription');
        }}
      />
    </View>
  );
}

const Header: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={onBack} style={styles.backBtn}>
      <ChevronLeft color="#fff" size={24} />
    </TouchableOpacity>
    <Text style={styles.headerTitle}>Paiement</Text>
    <View style={{ width: 40 }} />
  </View>
);

interface OperatorRowProps {
  operator: Operator;
  active: boolean;
  onPress: () => void;
}

const OperatorRow: React.FC<OperatorRowProps> = ({ operator, active, onPress }) => {
  const initials = operator.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.operatorRow, active && styles.operatorRowActive]}
    >
      <View style={[styles.operatorBadge, { backgroundColor: operator.color ?? C.green }]}>
        <Text style={styles.operatorBadgeText}>{initials}</Text>
      </View>
      <Text style={styles.operatorName}>{operator.name}</Text>
      <View style={[styles.radio, active && styles.radioActive]}>
        {active && <View style={styles.radioDot} />}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    height: 64,
    backgroundColor: C.green,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Poppins_700Bold', fontSize: 17, color: '#fff' },

  scroll: { paddingHorizontal: 20, paddingTop: 20 },

  planCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planCardLabel: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: C.ink3 },
  planCardPrice: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: C.ink,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  planCardCurrency: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: C.ink3 },
  modifyLink: { fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: C.green },

  sectionTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: C.ink,
    marginBottom: 10,
  },

  operatorsList: { gap: 8 },
  operatorRow: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.line,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  operatorRowActive: { borderColor: C.green },
  operatorBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  operatorBadgeText: { fontFamily: 'Poppins_700Bold', fontSize: 14, color: '#fff' },
  operatorName: { flex: 1, fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: C.ink },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: C.green, backgroundColor: C.green },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },

  phoneBlock: { marginTop: 22 },
  fieldLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: C.ink2,
    marginBottom: 6,
  },
  phoneRow: { flexDirection: 'row', gap: 8 },
  prefixBox: {
    height: 54,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: C.line,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prefixFlag: { fontSize: 18 },
  prefixText: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: C.ink },
  phoneInput: {
    height: 54,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: C.line,
    borderRadius: 14,
    fontFamily: 'Poppins_500Medium',
    fontSize: 15,
    color: C.ink,
  },
  phoneInputFlex: { flex: 1 },
  phoneInputError: { borderColor: C.danger },
  fieldError: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11.5,
    color: C.danger,
    marginTop: 6,
  },
  infoBox: {
    backgroundColor: C.greenSoft,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 12,
  },
  infoText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: C.ink2,
    lineHeight: 18,
  },

  processingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  processingTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: C.ink,
    marginTop: 24,
    textAlign: 'center',
  },
  processingDesc: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13.5,
    color: C.ink2,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 10,
  },
  statusText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: C.danger,
    marginTop: 16,
  },

  stateBox: { paddingVertical: 40, alignItems: 'center', justifyContent: 'center' },
  errorText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: C.ink2,
    textAlign: 'center',
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
  },
  ctaDisabled: { opacity: 0.5 },
  ctaText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: '#fff',
    letterSpacing: 0.2,
  },
});
