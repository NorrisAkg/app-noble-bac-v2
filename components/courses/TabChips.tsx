import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { DiamondIcon } from '@/components/ui/DiamondIcon';

interface Tab {
  k: string;
  label: string;
}

interface TabChipsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabKey: string) => void;
}

export const TabChips: React.FC<TabChipsProps> = ({ tabs, activeTab, onChange }) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {tabs.map((t) => {
        const active = t.k === activeTab;
        return (
          <TouchableOpacity
            key={t.k}
            onPress={() => onChange(t.k)}
            activeOpacity={0.8}
            style={[
              styles.chip,
              active ? styles.chipActive : styles.chipInactive,
              active && styles.activeShadow,
            ]}
          >
            <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]}>
              {t.label}
            </Text>
            <DiamondIcon size={14} gradientId={`dmd-${t.k}`} />
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 0,
    flexShrink: 0,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 10,
  },
  chip: {
    height: 42,
    paddingHorizontal: 18,
    borderRadius: 21,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chipActive: {
    backgroundColor: '#3DBE45',
  },
  chipInactive: {
    backgroundColor: '#E5E0F4',
  },
  activeShadow: {
    shadowColor: '#3DBE45',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  label: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
  labelActive: {
    color: '#fff',
  },
  labelInactive: {
    color: '#1A2027',
  },
});
