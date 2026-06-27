import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  BackHandler,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import { ChevronLeft } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';

import { initiatePayment, getPaymentStatus } from '@/services/paymentService';
import { getApiErrorMessage } from '@/utils/apiError';
import { PremiumSuccessSheet } from '@/components/ui/PremiumSuccessSheet';
import { C } from '@/constants/theme';
import type { TransactionStatus } from '@/types/api';

/**
 * URL de retour côté backend — le serveur redirige ensuite vers le deep link.
 * On intercepte cette URL dans la WebView pour détecter la fin du paiement
 * sans quitter l'app.
 */
const MONEROO_RETURN_PATH = '/payments/moneroo/return';

const POLL_INITIAL_MS = 2_000;
const POLL_STEP_MS = 1_500;
const POLL_MAX_MS = 8_000;
const POLL_TIMEOUT_MS = 90_000;

export default function PaymentCheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { plan_id } = useLocalSearchParams<{ plan_id?: string }>();
  const planId = plan_id ? Number(plan_id) : null;

  // 'initiating' → appel API en cours
  // 'checkout'   → WebView Moneroo visible
  // 'polling'    → WebView fermée, attente confirmation webhook
  const [step, setStep] = useState<'initiating' | 'checkout' | 'polling'>('initiating');
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [webViewReady, setWebViewReady] = useState(false);
  const [transactionId, setTransactionId] = useState<number | null>(null);
  const [status, setStatus] = useState<TransactionStatus>('pending');
  const [showSuccessSheet, setShowSuccessSheet] = useState(false);

  const finishedRef = useRef(false);
  const startedAtRef = useRef<number>(0);
  const checkoutDoneRef = useRef<(() => void) | null>(null);

  // Bloque le bouton retour matériel pendant le traitement.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-initiation au montage : appel API immédiat, pas d'écran intermédiaire.
  useEffect(() => {
    if (!planId) return;
    let cancelled = false;

    (async () => {
      try {
        const { transaction, payment_url } = await initiatePayment({
          subscriptionPlanId: planId,
        });
        if (cancelled) return;

        startedAtRef.current = Date.now();
        setTransactionId(transaction.id);

        if (payment_url) {
          // Hosted checkout : ouvre la page Moneroo dans la WebView intégrée.
          setCheckoutUrl(payment_url);
          setStep('checkout');
        } else {
          // Direct charge (FedaPay USSD) : push déjà envoyé, on poll.
          setStep('polling');
        }
      } catch (e) {
        if (!cancelled) {
          router.back();
          Alert.alert('Paiement', getApiErrorMessage(e, 'Impossible de démarrer le paiement.'));
        }
      }
    })();

    return () => { cancelled = true; };
    // mount-only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          await queryClient.invalidateQueries({ queryKey: ['subscription', 'active'] });
          await queryClient.invalidateQueries({ queryKey: ['active-subscription'] });
          await queryClient.invalidateQueries({ queryKey: ['profile'] });
          await queryClient.invalidateQueries({ queryKey: ['my-subscription-transactions'] });
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
   * Quand Moneroo redirige vers notre return URL (ou un deep link noblebac://),
   * on ferme la WebView et on déclenche le polling immédiatement.
   */
  const onShouldStartLoadWithRequest = (request: ShouldStartLoadRequest): boolean => {
    const url = request.url;
    if (url.startsWith('noblebac://') || url.includes(MONEROO_RETURN_PATH)) {
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
    if (step === 'initiating' || finishedRef.current) {
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

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={{ height: insets.top, backgroundColor: C.green }} />
      <Header onBack={handleBack} />

      {/* Écran de chargement / polling */}
      {step !== 'checkout' && (
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

      {/* WebView Moneroo — visible uniquement pendant step === 'checkout' */}
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
          />
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
