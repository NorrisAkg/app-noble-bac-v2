import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  BackHandler,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { ChevronLeft } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { TouchableOpacity } from 'react-native';

import { initiatePayment, getPaymentStatus } from '@/services/paymentService';
import { getApiErrorMessage } from '@/utils/apiError';
import { PremiumSuccessSheet } from '@/components/ui/PremiumSuccessSheet';
import { C } from '@/constants/theme';
import type { TransactionStatus } from '@/types/api';

/** Schéma deep link enregistré dans app.json (cf. C2 Moneroo). */
const DEEP_LINK_SCHEME = 'noblebac://payment/callback';

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
  // 'processing' → browser Moneroo ouvert ou polling webhook
  const [step, setStep] = useState<'initiating' | 'processing'>('initiating');
  const [processingLabel, setProcessingLabel] = useState('Préparation du paiement…');
  const [processingDesc, setProcessingDesc] = useState('');
  const [transactionId, setTransactionId] = useState<number | null>(null);
  const [status, setStatus] = useState<TransactionStatus>('pending');
  const [showSuccessSheet, setShowSuccessSheet] = useState(false);

  const finishedRef = useRef(false);
  const startedAtRef = useRef<number>(0);
  const checkoutDoneRef = useRef<(() => void) | null>(null);

  // Bloque le bouton retour pendant le traitement.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-initiation au montage : pas d'écran intermédiaire de sélection.
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
          // Hosted checkout (Moneroo) : confirmation puis ouverture du navigateur.
          const proceed = await new Promise<boolean>((resolve) => {
            Alert.alert(
              'Page de paiement sécurisée',
              "Une page de paiement sécurisée va s'ouvrir. Valide ton paiement, puis reviens sur cet écran : la confirmation est automatique.",
              [
                { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
                { text: 'Continuer', onPress: () => resolve(true) },
              ],
              { cancelable: true, onDismiss: () => resolve(false) },
            );
          });

          if (cancelled) return;

          if (!proceed) {
            finishedRef.current = true;
            router.back();
            return;
          }

          setStep('processing');
          setProcessingLabel('Page de paiement ouverte…');
          setProcessingDesc(
            "Valide ton paiement sur la page sécurisée. La confirmation est automatique dès que le paiement est reçu.",
          );

          // openAuthSessionAsync intercepte le deep link noblebac:// et revient
          // automatiquement dans l'app (nécessite un dev build, pas Expo Go).
          await WebBrowser.openAuthSessionAsync(payment_url, DEEP_LINK_SCHEME);

          if (cancelled) return;

          setProcessingLabel('Vérification en cours…');
          setProcessingDesc(
            "Le paiement est en cours de validation. La confirmation est automatique.",
          );
          checkoutDoneRef.current?.();
        } else {
          // Direct charge (FedaPay USSD) : le push a été envoyé, on poll.
          setStep('processing');
          setProcessingLabel('Confirme sur ton téléphone');
          setProcessingDesc(
            'Une demande de paiement a été envoyée à ton numéro. Valide-la avec ton code mobile money pour activer ton abonnement. Ne ferme pas cet écran.',
          );
        }
      } catch (e) {
        if (!cancelled) {
          router.back();
          Alert.alert('Paiement', getApiErrorMessage(e, 'Impossible de démarrer le paiement.'));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // mount-only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Polling avec backoff linéaire. Déclenché dès que transactionId est posé.
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

    timeoutId = setTimeout(poll, currentInterval);

    return () => {
      clearTimeout(timeoutId);
      checkoutDoneRef.current = null;
    };
  }, [transactionId, queryClient, router]);

  const handleBack = () => {
    if (finishedRef.current || step === 'initiating') {
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

      <View style={styles.processingBox}>
        <ActivityIndicator size="large" color={C.green} />
        <Text style={styles.processingTitle}>{processingLabel}</Text>
        {processingDesc.length > 0 && (
          <Text style={styles.processingDesc}>{processingDesc}</Text>
        )}
        {status !== 'pending' && status !== 'confirmed' && (
          <Text style={styles.statusText}>
            Statut : {status === 'expired' ? 'Expiré' : 'Échoué'}
          </Text>
        )}
      </View>

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

  stateBox: { paddingVertical: 40, alignItems: 'center', justifyContent: 'center' },
  errorText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: C.ink2,
    textAlign: 'center',
  },
});
