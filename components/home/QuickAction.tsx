import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BookOpen, FileText, Star } from 'lucide-react-native';

interface QuickActionProps {
  label: string;
  icon: 'book' | 'paper' | 'star';
  onPress: () => void;
  accent?: boolean;
}

export const QuickAction: React.FC<QuickActionProps> = ({ label, icon, onPress, accent }) => {
  const bgCard = accent ? '#E8A090' : '#fff';
  const bgIcon = accent ? 'rgba(255,255,255,0.22)' : '#EAF7EB';
  const iconColor = accent ? '#fff' : '#3DBE45';
  const textColor = accent ? '#fff' : '#1A2027';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.82}
      style={[
        styles.card,
        { backgroundColor: bgCard },
        accent ? styles.accentShadow : styles.defaultShadow,
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: bgIcon }]}>
        {icon === 'book' && <BookOpen size={20} color={iconColor} strokeWidth={1.8} />}
        {icon === 'paper' && <FileText size={20} color={iconColor} strokeWidth={1.8} />}
        {icon === 'star' && <Star size={20} color={iconColor} fill={iconColor} strokeWidth={1.8} />}
      </View>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 8,
    minHeight: 92,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
  },
  defaultShadow: {
    shadowColor: '#1A2027',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  accentShadow: {
    shadowColor: '#E8624C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },
});
