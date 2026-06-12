import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import type { Advertisement } from '@/types/api';

const SLIDE_INTERVAL_MS = 4000;
const CARD_HEIGHT = 124;

interface Props {
  ads: Advertisement[];
}

/**
 * Carrousel de publicités externes pleine largeur (cf. maquette home-v2) :
 * créa image fournie par le back-office, tag « Publicité », rotation auto,
 * dots sous le viewport. Rien n'est rendu quand aucune pub n'est active.
 */
export const AdsBanner: React.FC<Props> = ({ ads }) => {
  const listRef = useRef<FlatList<Advertisement>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [slideWidth, setSlideWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
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

  // setTimeout ré-armé à chaque changement d'index (auto ou swipe manuel) :
  // une interaction utilisateur repart donc pour un délai plein, et aucune
  // avance auto ne se déclenche pendant un drag en cours.
  useEffect(() => {
    if (ads.length <= 1 || isDragging) {
      return;
    }
    const timer = setTimeout(scrollToNext, SLIDE_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [activeIndex, isDragging, ads.length, scrollToNext]);

  if (ads.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      <View
        style={styles.viewport}
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
            onScrollBeginDrag={() => setIsDragging(true)}
            onMomentumScrollEnd={(e) => {
              if (slideWidth > 0) {
                const idx = Math.min(
                  ads.length - 1,
                  Math.max(0, Math.round(e.nativeEvent.contentOffset.x / slideWidth)),
                );
                indexRef.current = idx;
                setActiveIndex(idx);
              }
              setIsDragging(false);
            }}
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
                  source={{ uri: item.image_url ?? undefined }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                />
                <View style={styles.tag}>
                  <Text style={styles.tagText}>Publicité</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
      {ads.length > 1 && (
        <View style={styles.dots}>
          {ads.map((ad, i) => (
            <View
              key={ad.id}
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
    marginBottom: 26,
  },
  viewport: {
    height: CARD_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E6E8EB',
  },
  tag: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.22)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 8.5,
    letterSpacing: 0.5,
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E6E8EB',
  },
  dotActive: {
    width: 16,
    backgroundColor: '#3DBE45',
  },
});
