import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

import { C } from '@/constants/theme';

interface ComingSoonOverlayProps {
  isOpen: boolean;
  /** Titre du feature (ex. « Tuteur IA », « Plan d'étude »). */
  feature?: string;
  description?: string;
  /** Emoji affiché dans la tile carrée. */
  icon?: string;
  onClose: () => void;
  /** Callback déclenché à l'envoi du formulaire de capture. Reçoit le contact saisi. */
  onSubmit?: (contact: string) => void;
}

/**
 * Overlay « Disponible prochainement » — aligné
 * `templates/screens-coming-soon.jsx`. Modal plein écran avec backdrop
 * sombre, card centrale, badge salmon pulsant, icône gradient vert,
 * input de capture (téléphone OU email), bouton « Me prévenir ».
 *
 * Réutilisable pour cacher temporairement une feature non livrée
 * (placeholder pendant les phases 2-3 du roadmap produit).
 */
export const ComingSoonOverlay: React.FC<ComingSoonOverlayProps> = ({
  isOpen,
  feature = 'Cette fonctionnalité',
  description = 'On la peaufine encore. Laisse-nous ton numéro pour être prévenu(e) en avant-première.',
  icon = '✨',
  onClose,
  onSubmit,
}) => {
  const [contact, setContact] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    const value = contact.trim();
    if (!value) return;
    setSubmitted(true);
    onSubmit?.(value);
  };

  const handleClose = () => {
    setSubmitted(false);
    setContact('');
    onClose();
  };

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Animated.View entering={ZoomIn.duration(320).springify().damping(14)}>
          <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
            <View style={styles.badge}>
              <View style={styles.badgeDot} />
              <Text style={styles.badgeText}>Disponible prochainement</Text>
            </View>

            <LinearGradient
              colors={[C.green, C.greenDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconTile}
            >
              <Text style={styles.iconEmoji}>{icon}</Text>
            </LinearGradient>

            <Text style={styles.title}>{feature}</Text>
            <Text style={styles.desc}>{description}</Text>

            {!submitted ? (
              <>
                <TextInput
                  value={contact}
                  onChangeText={setContact}
                  placeholder="+221 ou ton@email.sn"
                  placeholderTextColor={C.ink3}
                  style={[styles.input, contact.length > 0 && { borderColor: C.green }]}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={!contact.trim()}
                  activeOpacity={0.85}
                  style={[styles.primaryBtn, !contact.trim() && styles.primaryBtnDisabled]}
                >
                  <Text style={styles.primaryBtnText}>Me prévenir au lancement</Text>
                </TouchableOpacity>
                <Text style={styles.legalText}>Aucun spam. Un seul SMS quand on lance.</Text>
              </>
            ) : (
              <Animated.View entering={FadeIn.duration(260)} style={styles.successBox}>
                <View style={styles.successIconCircle}>
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M5 12 L10 17 L19 7"
                      stroke="#fff"
                      strokeWidth={2.6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.successTitle}>C&apos;est noté !</Text>
                  <Text style={styles.successDesc}>
                    On t&apos;envoie un SMS dès que c&apos;est prêt.
                  </Text>
                </View>
              </Animated.View>
            )}

            <TouchableOpacity
              onPress={handleClose}
              style={styles.secondaryBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryBtnText}>Retour</Text>
            </TouchableOpacity>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20,28,36,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.35,
    shadowRadius: 50,
    elevation: 12,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: C.salmonSoft,
    marginBottom: 14,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.salmon,
  },
  badgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10.5,
    color: C.salmonDark,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  iconTile: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 22,
    elevation: 6,
  },
  iconEmoji: {
    fontSize: 30,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: C.ink,
    letterSpacing: -0.4,
    lineHeight: 26,
  },
  desc: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13.5,
    color: C.ink2,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 18,
  },
  input: {
    height: 50,
    paddingHorizontal: 14,
    backgroundColor: C.bg,
    borderWidth: 1.5,
    borderColor: C.line,
    borderRadius: 12,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: C.ink,
    marginBottom: 10,
  },
  primaryBtn: {
    height: 52,
    borderRadius: 26,
    backgroundColor: C.green,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 4,
  },
  primaryBtnDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
  },
  primaryBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14.5,
    color: '#fff',
    letterSpacing: 0.2,
  },
  legalText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: C.ink3,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 16,
  },
  successBox: {
    backgroundColor: C.greenSoft,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  successIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13.5,
    color: C.greenDark,
  },
  successDesc: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: C.ink2,
    marginTop: 2,
  },
  secondaryBtn: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  secondaryBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13.5,
    color: C.ink2,
  },
});
