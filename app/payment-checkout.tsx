import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  BackHandler,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import { ChevronLeft, ChevronDown } from 'lucide-react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { initiatePayment, getPaymentStatus } from '@/services/paymentService';
import { getProfile } from '@/services/profileService';
import { getOperators } from '@/services/referentialService';
import { getApiErrorMessage } from '@/utils/apiError';
import { buildE164Phone } from '@/utils/phone';
import { displayCurrency } from '@/utils/currency';
import { PremiumSuccessSheet } from '@/components/ui/PremiumSuccessSheet';
import { OperatorPickerSheet } from '@/components/ui/OperatorPickerSheet';
import { C } from '@/constants/theme';
import type { Operator, TransactionStatus } from '@/types/api';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Chemins de retour des gateways — interceptés dans la WebView pour détecter
 * la fin du paiement sans quitter l'app.
 */
const RETURN_PATHS = ['/payments/moneroo/return', '/payment/confirm'];

const POLL_INITIAL_MS = 2_000;
const POLL_STEP_MS = 1_500;
const POLL_MAX_MS = 8_000;
const POLL_TIMEOUT_MS = 90_000;

export default function PaymentCheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { plan_id, plan_label, plan_amount, plan_currency } = useLocalSearchParams<{
    plan_id?: string;
    plan_label?: string;
    plan_amount?: string;
    plan_currency?: string;
  }>();
  const planId = plan_id ? Number(plan_id) : null;

  // 'select'     → choix opérateur + numéro, avant initiation
  // 'initiating' → appel API en cours
  // 'checkout'   → WebView hébergée visible
  // 'polling'    → WebView fermée, attente confirmation webhook
  const [step, setStep] = useState<'select' | 'initiating' | 'checkout' | 'polling'>('select');
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [webViewReady, setWebViewReady] = useState(false);
  const [transactionId, setTransactionId] = useState<number | null>(null);
  const [status, setStatus] = useState<TransactionStatus>('pending');
  const [showSuccessSheet, setShowSuccessSheet] = useState(false);

  // Sélection avant initiation.
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [phone, setPhone] = useState('');
  const [operatorSheetOpen, setOperatorSheetOpen] = useState(false);
  const phonePrefilledRef = useRef(false);

  const finishedRef = useRef(false);
  const startedAtRef = useRef<number>(0);
  const checkoutDoneRef = useRef<(() => void) | null>(null);

  const profileQuery = useQuery({ queryKey: ['profile'], queryFn: getProfile });
  const countryId = profileQuery.data?.country.id ?? null;

  const operatorsQuery = useQuery({
    queryKey: queryKeys.referential.operators(countryId),
    queryFn: () => getOperators(countryId as number),
    enabled: countryId !== null,
    staleTime: 10 * 60 * 1000,
  });
  const operators = operatorsQuery.data ?? [];

  // Préremplit le numéro à débiter avec celui du profil (une seule fois).
  useEffect(() => {
    if (!phonePrefilledRef.current && profileQuery.data?.phone) {
      setPhone(profileQuery.data.phone);
      phonePrefilledRef.current = true;
    }
  }, [profileQuery.data]);

  // Bloque le bouton retour matériel pendant le traitement.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const startPayment = async () => {
    if (planId === null || step === 'initiating') return;
    setStep('initiating');

    try {
      // Le champ est libre : l'utilisateur tape aussi bien "01 66 00 00 01"
      // que "+2290166000001". Le backend n'accepte que de l'E.164 strict
      // (E164PhoneRule), donc on recompose avant d'envoyer plutôt que de le
      // laisser répondre 422 sur un numéro pourtant correct.
      const e164 = phone.trim()
        ? buildE164Phone(profileQuery.data?.country.phone_code ?? '', phone)
        : undefined;

      const { transaction, payment_url } = await initiatePayment({
        subscriptionPlanId: planId,
        operatorId: selectedOperator?.id,
        phoneNumber: e164,
      });

      startedAtRef.current = Date.now();
      setTransactionId(transaction.id);

      if (payment_url) {
        // Checkout hébergé : ouvre la page de paiement dans la WebView intégrée.
        setCheckoutUrl(payment_url);
        setStep('checkout');
      } else {
        // Débit direct (FedaPay USSD) : push déjà envoyé, on poll.
        setStep('polling');
      }
    } catch (e) {
      setStep('select');
      Alert.alert('Paiement', getApiErrorMessage(e, 'Impossible de démarrer le paiement.'));
    }
  };

  // Polling avec backoff linéaire, déclenché dès que transactionId est posé.
  useEffect(() => {
    if (transactionId === null) return;

    let currentInterval = POLL_INITIAL_MS;
    let timeoutId: ReturnType<typeof setTimeout>;

    const poll = async () => {
      if (finishedRef.current) return;

      if (Date.now() - startedAtRef.current > POLL_TIMEOUT_MS) {
        finishedRef.current = true;
        Alert.alert(
          'Paiement en cours de validation',
          'La confirmation prend plus de temps que prévu. Tu seras notifié dès que ton abonnement sera activé. Tu peux vérifier le statut dans "Mon abonnement".',
          [{ text: 'OK', onPress: () => router.replace('/my-subscription') }],
        );
        return;
      }

      try {
        const tx = await getPaymentStatus(transactionId);
        if (tx.status === 'confirmed') {
          finishedRef.current = true;
          // Un seul préfixe couvre désormais abonnement actif, plans et
          // transactions : avant l'unification des clés, deux des quatre
          // invalidations visaient des clés que plus aucun écran n'utilisait
          // (`['my-subscription-transactions']` notamment).
          await queryClient.invalidateQueries({ queryKey: queryKeys.subscription.all() });
          await queryClient.invalidateQueries({ queryKey: ['profile'] });
          setStatus('confirmed');
          setShowSuccessSheet(true);
          return;
        } else if (tx.status === 'failed' || tx.status === 'expired') {
          finishedRef.current = true;
          setStatus(tx.status);
          Alert.alert(
            'Paiement non abouti',
            tx.status === 'expired'
              ? 'Le délai de paiement a expiré. Réessaie.'
              : "Le paiement a échoué. Aucun montant n'a été débité.",
            [{ text: 'OK', onPress: () => router.back() }],
          );
          return;
        }
      } catch (e) {
        console.warn('[payment-checkout] poll status failed:', getApiErrorMessage(e));
      }

      currentInterval = Math.min(currentInterval + POLL_STEP_MS, POLL_MAX_MS);
      timeoutId = setTimeout(poll, currentInterval);
    };

    checkoutDoneRef.current = () => {
      clearTimeout(timeoutId);
      currentInterval = POLL_INITIAL_MS;
      void poll();
    };

    // Pour le direct charge, le polling démarre immédiatement.
    // Pour le hosted checkout, checkoutDoneRef déclenche le poll au bon moment.
    if (step !== 'checkout') {
      timeoutId = setTimeout(poll, currentInterval);
    }

    return () => {
      clearTimeout(timeoutId);
      checkoutDoneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionId, queryClient, router]);

  /**
   * Intercepte chaque navigation dans la WebView.
   * Quand la gateway redirige vers notre return URL (ou un deep link noblebac://),
   * on ferme la WebView et on déclenche le polling immédiatement.
   */
  const onShouldStartLoadWithRequest = (request: ShouldStartLoadRequest): boolean => {
    const url = request.url;
    if (url.startsWith('noblebac://') || RETURN_PATHS.some((p) => url.includes(p))) {
      setCheckoutUrl(null);
      setWebViewReady(false);
      setStep('polling');
      // Réinitialise le timer de timeout à partir de la fermeture de la WebView.
      startedAtRef.current = Date.now();
      checkoutDoneRef.current?.();
      return false; // bloque la navigation dans la WebView
    }
    return true;
  };

  const handleBack = () => {
    if (step === 'select' || step === 'initiating' || finishedRef.current) {
      router.back();
      return;
    }
    Alert.alert(
      'Annuler le paiement ?',
      'Si tu as déjà confirmé côté opérateur, la transaction sera traitée en arrière-plan.',
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

  const hasOperators = operators.length > 0;
  const canPay = !hasOperators || selectedOperator !== null;
  const isPreparing = profileQuery.isLoading || operatorsQuery.isLoading;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={{ height: insets.top, backgroundColor: C.green }} />
      <Header onBack={handleBack} />

      {/* Étape de sélection : opérateur + numéro à débiter */}
      {step === 'select' && (
        <>
          <ScrollView
            contentContainerStyle={styles.selectScroll}
            showsVerticalScrollIndicator={false}
          >
            {plan_label && (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>{plan_label}</Text>
                {plan_amount && (
                  <Text style={styles.summaryAmount}>
                    {new Intl.NumberFormat('fr-FR').format(Number(plan_amount))}{' '}
                    {displayCurrency(plan_currency ?? 'XOF')}
                  </Text>
                )}
              </View>
            )}

            {isPreparing ? (
              <View style={styles.stateBox}>
                <ActivityIndicator color={C.green} />
              </View>
            ) : (
              <>
                {hasOperators && (
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Opérateur mobile money</Text>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setOperatorSheetOpen(true)}
                      style={styles.selector}
                    >
                      <Text
                        style={[
                          styles.selectorText,
                          !selectedOperator && styles.selectorPlaceholder,
                        ]}
                      >
                        {selectedOperator ? selectedOperator.name : 'Choisis ton opérateur'}
                      </Text>
                      <ChevronDown size={20} color={C.ink3} />
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Numéro à débiter</Text>
                  <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    // Pas d'exemple de numéro : l'ancien (« +229 66 00 00 01 »)
                    // était au format béninois à 8 chiffres, abandonné en 2024,
                    // et n'avait de sens pour aucun autre pays.
                    placeholder={`${profileQuery.data?.country.phone_code ?? ''} …`.trim()}
                    placeholderTextColor={C.ink3}
                    autoCapitalize="none"
                  />
                  <Text style={styles.fieldHint}>
                    Le numéro de ton compte mobile money. L&apos;indicatif{' '}
                    {profileQuery.data?.country.phone_code ?? ''} est ajouté automatiquement si tu
                    ne le mets pas.
                  </Text>
                </View>
              </>
            )}
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <TouchableOpacity
              onPress={startPayment}
              activeOpacity={0.85}
              disabled={isPreparing || !canPay}
              style={[styles.cta, (isPreparing || !canPay) && styles.ctaDisabled]}
            >
              <Text style={styles.ctaText}>
                {hasOperators ? 'Payer' : 'Continuer vers le paiement'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.footerLegal}>Paiement sécurisé</Text>
          </View>
        </>
      )}

      {/* Écran de chargement / polling */}
      {(step === 'initiating' || step === 'polling') && (
        <View style={styles.processingBox}>
          <ActivityIndicator size="large" color={C.green} />
          <Text style={styles.processingTitle}>
            {step === 'initiating' ? 'Préparation du paiement…' : 'Vérification en cours…'}
          </Text>
          {step === 'polling' && (
            <Text style={styles.processingDesc}>
              Le paiement est en cours de validation. La confirmation est automatique dès que le
              paiement est reçu.
            </Text>
          )}
          {status !== 'pending' && status !== 'confirmed' && (
            <Text style={styles.statusText}>
              Statut : {status === 'expired' ? 'Expiré' : 'Échoué'}
            </Text>
          )}
        </View>
      )}

      {/* WebView checkout hébergé — visible uniquement pendant step === 'checkout' */}
      {checkoutUrl !== null && (
        <View style={styles.webViewContainer}>
          {!webViewReady && (
            <View style={styles.webViewLoader}>
              <ActivityIndicator size="large" color={C.green} />
              <Text style={styles.webViewLoaderText}>Chargement de la page de paiement…</Text>
            </View>
          )}
          <WebView
            style={webViewReady ? styles.webView : styles.webViewHidden}
            source={{ uri: checkoutUrl }}
            onLoad={() => setWebViewReady(true)}
            onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState={false}
            // Empêche les liens target="_blank" / window.open d'ouvrir
            // le navigateur système — toute navigation reste dans la WebView.
            setSupportMultipleWindows={false}
            onOpenWindow={(e) => {
              // iOS : intercepte window.open() et charge l'URL dans la WebView.
              setCheckoutUrl(e.nativeEvent.targetUrl);
            }}
          />
        </View>
      )}

      <OperatorPickerSheet
        isOpen={operatorSheetOpen}
        onClose={() => setOperatorSheetOpen(false)}
        operators={operators}
        selectedId={selectedOperator?.id ?? null}
        onSelect={setSelectedOperator}
      />

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

  selectScroll: { padding: 20, gap: 20 },
  summaryCard: {
    backgroundColor: C.greenSoft,
    borderRadius: 16,
    padding: 16,
    marginBottom: 4,
  },
  summaryLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: C.ink,
  },
  summaryAmount: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: C.green,
    marginTop: 2,
  },
  field: { marginTop: 16 },
  fieldLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: C.ink2,
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  fieldHint: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11.5,
    color: C.ink3,
    marginTop: 6,
  },
  selector: {
    height: 54,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: C.line,
    borderRadius: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 15,
    color: C.ink,
  },
  selectorPlaceholder: { color: C.ink3 },
  input: {
    height: 54,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: C.line,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontFamily: 'Poppins_500Medium',
    fontSize: 15,
    color: C.ink,
  },

  footer: {
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
  ctaDisabled: { opacity: 0.6 },
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

  webViewContainer: { flex: 1 },
  webView: { flex: 1 },
  webViewHidden: { flex: 0, height: 0 },
  webViewLoader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  webViewLoaderText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: C.ink2,
  },

  stateBox: { paddingVertical: 40, alignItems: 'center', justifyContent: 'center' },
  errorText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: C.ink2,
    textAlign: 'center',
  },
});
