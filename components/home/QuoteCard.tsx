import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Quote as QuoteIcon } from 'lucide-react-native';
import type { Quote } from '@/types/api';

const ROTATE_INTERVAL_MS = 5000;

interface Props {
  quotes: Quote[];
}

/**
 * Bloc « Un mot pour aujourd'hui » : carrousel auto de citations
 * motivantes (cf. maquette home-v2, rotation côté client).
 */
export const QuoteCard: React.FC<Props> = ({ quotes }) => {
  const [index, setIndex] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (quotes.length <= 1) {
      return;
    }
    const timer = setInterval(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setIndex((i) => (i + 1) % quotes.length);
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      });
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [quotes.length, opacity]);

  if (quotes.length === 0) {
    return null;
  }

  const quote = quotes[index % quotes.length];

  return (
    <LinearGradient
      colors={['#11331F', '#0B2417']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.mark}>
        <QuoteIcon size={36} color="#fff" strokeWidth={2} />
      </View>
      <Animated.View style={{ opacity }}>
        <Text style={styles.text}>« {quote.text} »</Text>
        {quote.author && <Text style={styles.author}>{quote.author}</Text>}
      </Animated.View>
      {quotes.length > 1 && (
        <View style={styles.dots}>
          {quotes.map((q, i) => (
            <View key={q.id} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 20,
    paddingHorizontal: 18,
    overflow: 'hidden',
  },
  mark: {
    position: 'absolute',
    top: 14,
    right: 16,
    opacity: 0.18,
  },
  text: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: '#fff',
    lineHeight: 22,
    maxWidth: '82%',
  },
  author: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11.5,
    color: '#9DEBA2',
    marginTop: 10,
  },
  dots: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 16,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    width: 16,
    backgroundColor: '#9DEBA2',
  },
});
