import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Star } from 'lucide-react-native';

interface Props {
  onPress: () => void;
}

/** Bannière « Passe à Premium » pleine largeur (cf. maquette home-v2). */
export const PremiumBanner: React.FC<Props> = ({ onPress }) => (
  <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.wrapper}>
    <LinearGradient
      colors={['#D38576', '#E8A090']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.banner}
    >
      <View style={styles.icon}>
        <Star size={17} color="#fff" fill="#fff" />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.title}>Passe à Premium</Text>
        <Text style={styles.subtitle}>Corrigés, quiz illimités & tous les ouvrages</Text>
      </View>
      <ChevronRight size={16} color="#fff" strokeWidth={2.4} />
    </LinearGradient>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 24,
    borderRadius: 16,
    shadowColor: '#D38576',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 4,
  },
  banner: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13.5,
    color: '#fff',
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
  },
});
