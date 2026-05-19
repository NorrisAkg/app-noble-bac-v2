import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { AppBar } from '@/components/ui/AppBar';
import { C } from '@/constants/theme';

/**
 * Écran de suppression de compte RGPD — aligné
 * `templates/screens-mvp-additions.jsx:316-457`. Flow 2 étapes :
 * 1. `reason` : choix de motif + warning définitif.
 * 2. `confirm` : saisie obligatoire du mot « SUPPRIMER » avant
 *    déclenchement de la suppression.
 *
 * **Limite backend** : pas d'endpoint `DELETE /me/account`
 * (cf. `docs/BACKEND_GAPS.md` section 7.3). L'écran affiche une
 * alerte explicite et redirige vers le support tant que l'API
 * n'est pas livrée. Quand l'endpoint sera dispo, brancher
 * `deleteAccount({ reason, confirmation: 'SUPPRIMER' })`.
 */

const REASONS = [
  'Je n’utilise plus l’app',
  'J’ai trouvé une autre app',
  'Le contenu Premium ne m’intéresse pas',
  'Je veux protéger mes données',
  'Autre raison',
];

type Step = 'reason' | 'confirm';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>('reason');
  const [reason, setReason] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');

  const canConfirm = confirmText === 'SUPPRIMER';

  const handleFinalDelete = () => {
    // Backend endpoint pas encore disponible (cf. BACKEND_GAPS 7.3).
    // On informe l'utilisateur et on redirige vers le support.
    Alert.alert(
      'Demande enregistrée',
      'Pour le moment, la suppression définitive du compte se fait via notre support. On a noté ta demande — un agent te répondra sous 48h.',
      [
        { text: 'OK', onPress: () => router.replace('/settings/support') },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <AppBar title="Supprimer mon compte" onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {step === 'reason' && (
          <>
            <View style={styles.warningBox}>
              <Text style={styles.warningEmoji}>⚠️</Text>
              <Text style={styles.warningText}>
                <Text style={styles.warningStrong}>Cette action est définitive.</Text>
                {' '}Toute ta progression, tes quiz, tes paiements et ton abonnement actif seront supprimés. Aucun remboursement automatique n&apos;est possible.
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Pourquoi pars-tu ?</Text>

            <View style={{ gap: 8, marginBottom: 22 }}>
              {REASONS.map((r) => {
                const active = r === reason;
                return (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setReason(r)}
                    activeOpacity={0.85}
                    style={[styles.reasonRow, active && styles.reasonRowActive]}
                  >
                    <View style={[styles.radio, active && styles.radioActive]}>
                      {active && <View style={styles.radioDot} />}
                    </View>
                    <Text style={[styles.reasonLabel, active && styles.reasonLabelActive]}>
                      {r}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={() => reason && setStep('confirm')}
              disabled={!reason}
              activeOpacity={0.85}
              style={[styles.dangerBtn, !reason && styles.dangerBtnDisabled]}
            >
              <Text style={styles.dangerBtnText}>Continuer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.cancelBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Garder mon compte</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 'confirm' && (
          <>
            <Text style={styles.confirmEmoji}>🗑️</Text>
            <Text style={styles.confirmTitle}>Dernière confirmation</Text>
            <Text style={styles.confirmDesc}>
              Pour confirmer, tape{' '}
              <Text style={styles.confirmKeyword}>SUPPRIMER</Text>{' '}ci-dessous.
            </Text>

            <TextInput
              value={confirmText}
              onChangeText={(t) => setConfirmText(t.toUpperCase())}
              placeholder="SUPPRIMER"
              placeholderTextColor={C.ink3}
              autoCapitalize="characters"
              autoCorrect={false}
              style={[
                styles.confirmInput,
                canConfirm && styles.confirmInputActive,
              ]}
            />

            <Text style={styles.legalText}>
              Ton compte et toutes tes données seront effacés sous 30 jours,
              conformément à ton droit à l&apos;effacement (RGPD + lois locales UEMOA).
            </Text>

            <TouchableOpacity
              onPress={handleFinalDelete}
              disabled={!canConfirm}
              activeOpacity={0.85}
              style={[styles.dangerBtn, !canConfirm && styles.dangerBtnDisabled]}
            >
              <Text style={styles.dangerBtnText}>Supprimer définitivement</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setStep('reason')}
              style={styles.cancelBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Revenir</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  warningBox: {
    backgroundColor: '#FBE3DD',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  warningEmoji: {
    fontSize: 18,
  },
  warningText: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12.5,
    color: '#8E2A14',
    lineHeight: 19,
  },
  warningStrong: {
    fontFamily: 'Poppins_700Bold',
  },
  sectionTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: C.ink,
    marginBottom: 10,
  },
  reasonRow: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: C.line,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reasonRowActive: {
    backgroundColor: C.salmonSoft,
    borderColor: C.salmon,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    backgroundColor: C.salmon,
    borderColor: C.salmon,
  },
  radioDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  reasonLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13.5,
    color: C.ink,
    flex: 1,
  },
  reasonLabelActive: {
    color: C.salmonDark,
  },
  dangerBtn: {
    height: 52,
    borderRadius: 26,
    backgroundColor: C.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerBtnDisabled: {
    backgroundColor: '#F0DAD3',
  },
  dangerBtnText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14.5,
    color: '#fff',
  },
  cancelBtn: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  cancelBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13.5,
    color: C.ink2,
  },
  confirmEmoji: {
    fontSize: 56,
    textAlign: 'center',
    marginBottom: 12,
  },
  confirmTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: C.ink,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  confirmDesc: {
    marginTop: 8,
    marginBottom: 22,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13.5,
    color: C.ink2,
    textAlign: 'center',
    lineHeight: 20,
  },
  confirmKeyword: {
    fontFamily: 'Poppins_700Bold',
    color: C.danger,
  },
  confirmInput: {
    height: 54,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: C.line,
    borderRadius: 14,
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: C.ink,
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 18,
  },
  confirmInputActive: {
    borderColor: C.danger,
  },
  legalText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: C.ink3,
    lineHeight: 18,
    marginBottom: 18,
  },
});
