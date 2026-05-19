import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Linking,
  Alert,
  Platform,
  Share,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { C } from '@/constants/theme';

const WHATSAPP_BRAND = '#25D366';
const DEFAULT_HANDLE = 'wa.me/noble-bac-uemoa';
const DEFAULT_URL = 'https://wa.me/2250000000000'; // numéro à brancher quand le canal officiel sera live

interface WhatsAppSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** URL réelle à ouvrir (par défaut, placeholder UEMOA). */
  url?: string;
  /** Handle affiché dans le rectangle copy-paste. */
  handle?: string;
}

/**
 * Bottom sheet de promotion de la chaîne WhatsApp — aligné
 * `templates/screens-profile-extras.jsx:395-478`. Affiche le handle
 * canonique, propose de copier dans le presse-papier, puis d'ouvrir
 * WhatsApp natif via deep link `wa.me`. Branché depuis le menu
 * Profile.
 */
export const WhatsAppSheet: React.FC<WhatsAppSheetProps> = ({
  isOpen,
  onClose,
  url = DEFAULT_URL,
  handle = DEFAULT_HANDLE,
}) => {
  const handleShare = async () => {
    try {
      await Share.share({ message: `Rejoins la chaîne WhatsApp Noble BAC : ${url}` });
    } catch {
      // Silencieux : Share peut être annulé par l'utilisateur.
    }
  };

  const handleOpen = async () => {
    const can = await Linking.canOpenURL(url);
    if (can) {
      await Linking.openURL(url);
      onClose();
    } else {
      Alert.alert(
        'WhatsApp introuvable',
        Platform.OS === 'ios'
          ? 'Installe WhatsApp depuis l’App Store pour rejoindre la chaîne.'
          : 'Installe WhatsApp depuis le Play Store pour rejoindre la chaîne.',
      );
    }
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />

          <View style={styles.brandCircle}>
            <Svg width={40} height={40} viewBox="0 0 24 24" fill="#fff">
              <Path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.4-.1-.6.1-.2.2-.7.9-.9 1.1-.2.2-.3.2-.6.1-1.8-.8-2.9-1.5-4-3.3-.3-.5.3-.5.9-1.5.1-.2.1-.4 0-.5l-.9-2c-.2-.5-.4-.5-.6-.5h-.5c-.2 0-.5.1-.7.3-.3.3-.9 1-.9 2.3 0 1.4 1 2.7 1.1 2.9.1.2 2 3 4.7 4.2 1.8.8 2.4.8 3.2.7.5-.1 1.7-.7 2-1.3.3-.6.3-1.2.2-1.3-.1-.1-.3-.2-.6-.4Z" />
              <Path d="M21 11.5a9.5 9.5 0 0 1-14.3 8.2L2 21l1.3-4.7A9.5 9.5 0 1 1 21 11.5Zm-9.5-7.6a7.6 7.6 0 0 0-6.5 11.6l.2.3-.8 2.8 2.9-.7.3.2a7.6 7.6 0 1 0 4-14.2Z" />
            </Svg>
          </View>

          <Text style={styles.title}>Chaîne WhatsApp Noble BAC</Text>
          <Text style={styles.desc}>
            Reçois chaque semaine les annales fraîches, les conseils de profs,
            et les annonces du Noble BAC.
          </Text>

          <View style={styles.handleRow}>
            <Text style={styles.handleText} numberOfLines={1}>{handle}</Text>
            <TouchableOpacity onPress={handleShare} style={styles.copyBtn} activeOpacity={0.7}>
              <Text style={styles.copyBtnText}>Partager</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleOpen}
            style={styles.primaryBtn}
            activeOpacity={0.85}
          >
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="#fff">
              <Path d="M21 11.5a9.5 9.5 0 0 1-14.3 8.2L2 21l1.3-4.7A9.5 9.5 0 1 1 21 11.5Z" />
            </Svg>
            <Text style={styles.primaryBtnText}>Ouvrir dans WhatsApp</Text>
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
    backgroundColor: 'rgba(11,20,16,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 26,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.line,
    marginBottom: 18,
  },
  brandCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: WHATSAPP_BRAND,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: WHATSAPP_BRAND,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.55,
    shadowRadius: 22,
    elevation: 6,
    marginBottom: 14,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 19,
    color: C.ink,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  desc: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: C.ink2,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 18,
    maxWidth: 300,
  },
  handleRow: {
    width: '100%',
    backgroundColor: C.bg,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  handleText: {
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    color: C.ink,
  },
  copyBtn: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11.5,
    color: C.ink,
  },
  primaryBtn: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    backgroundColor: WHATSAPP_BRAND,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: WHATSAPP_BRAND,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.55,
    shadowRadius: 22,
    elevation: 6,
  },
  primaryBtnText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14.5,
    color: '#fff',
  },
  secondaryBtn: {
    width: '100%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  secondaryBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13.5,
    color: C.ink2,
  },
});
