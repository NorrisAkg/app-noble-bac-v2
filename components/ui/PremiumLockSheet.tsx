import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Rect, Path, Circle } from 'react-native-svg';

import { C } from '@/constants/theme';

interface PremiumLockSheetProps {
  isOpen: boolean;
  /** Description courte de la ressource bloquée (ex. « le corrigé », « cette vidéo »). */
  resourceLabel?: string;
  onClose: () => void;
  onUpgrade: () => void;
}

/**
 * Bottom sheet « Réservé Premium » — aligné
 * `templates/screens-mvp-additions.jsx:114-172`.
 *
 * Conçu pour s'afficher quand l'API renvoie un 403 sur une ressource
 * Premium (corrigé, vidéo, sujet ancien…). Remplace les `Alert.alert`
 * natifs par un point de conversion soigné.
 */
export const PremiumLockSheet: React.FC<PremiumLockSheetProps> = ({
  isOpen,
  resourceLabel = 'le corrigé',
  onClose,
  onUpgrade,
}) => {
  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />

          <LinearGradient
            colors={[C.green, C.greenDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconWrap}
          >
            <Svg width={34} height={34} viewBox="0 0 24 24" fill="none">
              <Rect x={5} y={11} width={14} height={10} rx={2} stroke="#fff" strokeWidth={2} />
              <Path
                d="M8 11 V8 a4 4 0 0 1 8 0 V11"
                stroke="#fff"
                strokeWidth={2}
                strokeLinecap="round"
              />
              <Circle cx={12} cy={16} r={1.4} fill="#fff" />
            </Svg>
          </LinearGradient>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>Réservé Premium</Text>
          </View>

          <Text style={styles.title}>Débloque {resourceLabel}</Text>
          <Text style={styles.desc}>
            Passe à Noble Premium pour accéder à tous les corrigés, quiz et
            vidéos sans limite.
          </Text>

          <TouchableOpacity
            onPress={() => {
              onClose();
              onUpgrade();
            }}
            style={styles.primaryBtn}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Passer Premium</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onClose}
            style={styles.secondaryBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryBtnText}>Plus tard</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(26,32,39,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 28,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.line,
    marginBottom: 18,
  },
  iconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.55,
    shadowRadius: 22,
    elevation: 6,
    marginBottom: 14,
  },
  badge: {
    backgroundColor: C.greenSoft,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 12,
  },
  badgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
    color: C.green,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: C.ink,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  desc: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13.5,
    color: C.ink2,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 18,
  },
  primaryBtn: {
    width: '100%',
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
  primaryBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: '#fff',
    letterSpacing: 0.2,
  },
  secondaryBtn: {
    width: '100%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  secondaryBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13.5,
    color: C.ink2,
  },
});
