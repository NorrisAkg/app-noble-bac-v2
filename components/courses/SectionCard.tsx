import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';

interface SectionItem {
  t: string;
  done: boolean;
}

interface Section {
  id: string;
  title: string;
  items: SectionItem[];
}

interface SectionCardProps {
  section: Section;
  open: boolean;
  onToggle: () => void;
  onItemClick?: (section: Section, item: SectionItem) => void;
}

export const SectionCard: React.FC<SectionCardProps> = ({ section, open, onToggle, onItemClick }) => {
  const animatedHeight = useRef(new Animated.Value(open ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: open ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [open, animatedHeight]);

  const bodyHeight = animatedHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, section.items.length * 56], // Approximate height per item
  });

  return (
    <View style={styles.card}>
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.7}
        style={styles.header}
      >
        <Text style={styles.title}>{section.title}</Text>
        <View style={styles.iconWrap}>
          <Animated.View style={{
            transform: [{
              rotate: animatedHeight.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '180deg'],
              })
            }]
          }}>
            <ChevronDown size={16} color="#7B5BD6" strokeWidth={2.4} />
          </Animated.View>
        </View>
      </TouchableOpacity>

      <Animated.View style={[styles.bodyContainer, { height: open ? 'auto' : bodyHeight, opacity: animatedHeight }]}>
        <View style={styles.body}>
          {section.items.map((it, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => onItemClick?.(section, it)}
              activeOpacity={0.7}
              style={[
                styles.itemRow,
                i < section.items.length - 1 && styles.itemBorder
              ]}
            >
              <Text style={styles.itemText}>{it.t}</Text>
              <View style={[
                styles.progressCircle,
                it.done ? styles.progressDone : styles.progressPending
              ]}>
                {it.done && <Check size={12} color="#fff" strokeWidth={3.5} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6E8EB',
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#1A2027',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    flex: 1,
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: '#1A2027',
    letterSpacing: -0.2,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EFEAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyContainer: {
    overflow: 'hidden',
  },
  body: {
    borderTopWidth: 1,
    borderTopColor: '#E6E8EB',
  },
  itemRow: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E6E8EB',
  },
  itemText: {
    flex: 1,
    fontFamily: 'Poppins_500Medium',
    fontSize: 14.5,
    color: '#1A2027',
    lineHeight: 20,
  },
  progressCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPending: {
    borderColor: '#D5DAE0',
    backgroundColor: 'transparent',
  },
  progressDone: {
    borderColor: '#3DBE45',
    backgroundColor: '#3DBE45',
  },
});
