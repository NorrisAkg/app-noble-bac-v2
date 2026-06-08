import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';

interface ChapterRowCardProps {
  title: string;
  subtitle: string;
  mode: 'pdf' | 'video';
  loading?: boolean;
  onClick: () => void;
}

export const ChapterRowCard: React.FC<ChapterRowCardProps> = ({
  title,
  subtitle,
  mode,
  loading = false,
  onClick,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onClick}
      disabled={loading}
      style={[styles.card, loading && styles.cardLoading]}
    >
      {mode === 'pdf' ? (
        <View style={styles.pdfIcon}>
          <Text style={styles.pdfText}>PDF</Text>
        </View>
      ) : (
        <View style={styles.videoIcon}>
          <Svg width={32} height={22} viewBox="0 0 32 22">
            <Path
              d="M31.3 3.4A4 4 0 0 0 28.5.6C26 0 16 0 16 0S6 0 3.5.6A4 4 0 0 0 .7 3.4C0 5.9 0 11 0 11s0 5.1.7 7.6A4 4 0 0 0 3.5 21.4C6 22 16 22 16 22s10 0 12.5-.6a4 4 0 0 0 2.8-2.8C32 16.1 32 11 32 11s0-5.1-.7-7.6z"
              fill="#FF0000"
            />
            <Path d="M13 15.5l8.5-4.5L13 6.5v9z" fill="#fff" />
          </Svg>
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="small" color="#5A6470" />
      ) : (
        <ChevronRight size={18} color="#5A6470" strokeWidth={2.2} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E6E8EB',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
    shadowColor: '#1A2027',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cardLoading: {
    opacity: 0.7,
  },
  pdfIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FCE9E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
    color: '#E14B36',
  },
  videoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F5F6F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14.5,
    color: '#1A2027',
    lineHeight: 18,
    letterSpacing: -0.1,
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11.5,
    color: '#9AA3AC',
    marginTop: 3,
  },
});
