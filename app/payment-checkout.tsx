import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  BackHandler,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import { ChevronLeft } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';

import { getPaymentStatus } from '@/services/paymentService';
import { getApiErrorMessage } from '@/utils/apiError';
import { PremiumSuccessSheet } from '@/components/ui/PremiumSuccessSheet';
import type { TransactionStatus } from '@/types/api';

/**
 * Intervalle entre deux polls de statut. CinetPay confirme generalement en
 * ~10-30s apres saisie OTP utilisateur. 4s est un compromis charge/UX.
 */
const POLL_INTERVAL_MS = 4_000;

/**
 * Borne haute du polling (en cas de webhook bloque, on n'attend pas
 * indefiniment). 5 min couvre largement le temps d'un paiement Mobile Money.
 */
const POLL_TIMEOUT_MS = 5 * 60 * 1_000;

export default function PaymentCheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { transaction_id, payment_url } = useLocalSearchParams<{
    transaction_id?: string;
    payment_url?: string;
  }>();

  const transactionId = transaction_id ? Number(transaction_id) : null;
  const url = payment_url ? decodeURIComponent(payment_url) : null;

  const [webViewLoading, setWebViewLoading] = useState(true);
  const [status, setStatus] = useState<TransactionStatus>('pending');
  const [showSuccessSheet, setShowSuccessSheet] = useState(false);
  const finishedRef = useRef(false);
  const startedAtRef = useRef<number>(Date.now());

  // Bloque le swipe back pendant le polling pour eviter de claquer l'ecran
  // entre l'OTP CinetPay et la confirmation webhook.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleCancel();
      return true;
    });
    return () => sub.remove();
    // handleCancel est défini plus bas et capture les refs/state au moment
    // du clic ; mount-only suffit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Polling du statut de la transaction. S'arrete des qu'on quitte 'pending'
  // ou apres POLL_TIMEOUT_MS.
  useEffect(() => {
    if (!transactionId) return;

    const interval = setInterval(async () => {
      if (finishedRef.current) return;

      // Timeout : on bascule en echec implicite et on previent l'utilisateur.
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
          await queryClient.invalidateQueries({ queryKey: ['active-subscription'] });
          await queryClient.invalidateQueries({ queryKey: ['profile'] });
          await queryClient.invalidateQueries({ queryKey: ['my-subscription-transactions'] });
          setStatus('confirmed');
          // Affiche le sheet « Tu es Premium ! » avec checkmark animé
          // (aligné maquette `screens-premium.jsx:32-68`) au lieu de
          // l'Alert.alert native.
          setShowSuccessSheet(true);
        } else if (tx.status === 'failed' || tx.status === 'expired') {
          finishedRef.current = true;
          clearInterval(interval);
          setStatus(tx.status);
          Alert.alert(
            'Paiement non abouti',
            tx.status === 'expired'
              ? 'Le delai de paiement a expire. Reessaie depuis l\'ecran Premium.'
              : 'Le paiement a echoue. Aucun montant n\'a ete debite.',
            [{ text: 'OK', onPress: () => router.back() }],
          );
        }
      } catch (e) {
        // On ne fait pas tomber le polling sur erreur reseau ponctuelle :
        // on retentera au prochain tick.
        console.warn('[payment-checkout] poll status failed:', getApiErrorMessage(e));
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [transactionId, queryClient, router]);

  const handleCancel = () => {
    if (finishedRef.current) {
      router.back();
      return;
    }
    Alert.alert(
      'Annuler le paiement ?',
      'Tu vas quitter la page de paiement. Si tu as deja confirme cote operateur, la transaction sera traitee en arriere-plan.',
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

  if (!transactionId || !url) {
    return (
      <View style={styles.container}>
        <View style={{ height: insets.top, backgroundColor: '#3DBE45' }} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft color="#fff" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Paiement</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.stateBox}>
          <Text style={styles.errorText}>
            Lien de paiement invalide. Reviens à l&apos;écran Premium et reessaie.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={{ height: insets.top, backgroundColor: '#3DBE45' }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.backBtn}>
          <ChevronLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paiement CinetPay</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.pollBanner}>
        <ActivityIndicator size="small" color="#3DBE45" />
        <Text style={styles.pollBannerText}>
          Confirmation automatique en attente — ne ferme pas l&apos;écran tant que tu n&apos;as pas validé.
        </Text>
      </View>

      <View style={styles.webViewWrap}>
        <WebView
          source={{ uri: url }}
          onLoadStart={() => setWebViewLoading(true)}
          onLoadEnd={() => setWebViewLoading(false)}
          startInLoadingState
          javaScriptEnabled
          domStorageEnabled
          thirdPartyCookiesEnabled
          mixedContentMode="always"
          style={styles.webView}
        />
        {webViewLoading && (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color="#3DBE45" />
          </View>
        )}
      </View>

      {status !== 'pending' && (
        <View style={styles.statusFooter}>
          <Text style={styles.statusFooterText}>
            Statut : {status === 'confirmed' ? 'Confirmé' : status === 'expired' ? 'Expiré' : 'Échoué'}
          </Text>
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

  pollBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#EAF7EB',
    borderBottomWidth: 1,
    borderBottomColor: '#D1E8D3',
  },
  pollBannerText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: '#1A2027',
    flex: 1,
    lineHeight: 16,
  },

  webViewWrap: { flex: 1, position: 'relative' },
  webView: { flex: 1, backgroundColor: '#fff' },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },

  stateBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  errorText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: '#5A6470',
    textAlign: 'center',
  },

  statusFooter: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#1A2027',
  },
  statusFooterText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
  },
});
