import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Linking,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import type { Advertisement } from '@/types/api';

const SLIDE_INTERVAL_MS = 3500;
const CARD_HEIGHT = 92;

interface Props {
  ads: Advertisement[];
}

export const AdsBanner: React.FC<Props> = ({ ads }) => {
  const listRef = useRef<FlatList<Advertisement>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [slideWidth, setSlideWidth] = useState(0);
  const indexRef = useRef(0);

  const scrollToNext = useCallback(() => {
    if (ads.length === 0) {
      return;
    }
    const next = (indexRef.current + 1) % ads.length;
    indexRef.current = next;
    setActiveIndex(next);
    listRef.current?.scrollToIndex({ index: next, animated: true });
  }, [ads.length]);

  useEffect(() => {
    if (ads.length <= 1) {
      return;
    }
    const timer = setInterval(scrollToNext, SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [ads.length, scrollToNext]);

  if (ads.length === 0) {
    return <View style={styles.placeholder} />;
  }

  return (
    <View
      style={styles.wrapper}
      onLayout={(e) => setSlideWidth(e.nativeEvent.layout.width)}
    >
      {slideWidth > 0 && (
        <FlatList
          ref={listRef}
          data={ads}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          getItemLayout={(_, index) => ({
            length: slideWidth,
            offset: slideWidth * index,
            index,
          })}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.9}
              style={{ width: slideWidth, height: CARD_HEIGHT }}
              onPress={() => Linking.openURL(item.link_url)}
            >
              <Image
                source={{ uri: item.image_url }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
            </TouchableOpacity>
          )}
        />
      )}
      {ads.length > 1 && (
        <View style={styles.dots}>
          {ads.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    height: CARD_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#1A2027',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  placeholder: {
    flex: 1,
    height: CARD_HEIGHT,
    borderRadius: 16,
    backgroundColor: '#E6E8EB',
  },
  dots: {
    position: 'absolute',
    bottom: 6,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 12,
  },
});
