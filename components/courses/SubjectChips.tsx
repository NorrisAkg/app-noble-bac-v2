import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Subject {
  k: string;
  label: string;
}

interface SubjectChipsProps {
  subjects: Subject[];
  value: Subject;
  onChange: (subject: Subject) => void;
}

export const SubjectChips: React.FC<SubjectChipsProps> = ({ subjects, value, onChange }) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {subjects.map((s) => {
        const active = s.k === value.k;
        return (
          <TouchableOpacity
            key={s.k}
            onPress={() => onChange(s)}
            activeOpacity={0.8}
            style={[
              styles.chip,
              active ? styles.chipActive : styles.chipInactive,
            ]}
          >
            <Text
              style={[
                styles.label,
                active ? styles.labelActive : styles.labelInactive,
              ]}
            >
              {s.label}
            </Text>
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
    paddingTop: 12,
    paddingBottom: 4,
    gap: 8,
  },
  chip: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: '#3DBE45',
    borderColor: '#3DBE45',
  },
  chipInactive: {
    backgroundColor: '#fff',
    borderColor: '#E6E8EB',
  },
  label: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12.5,
  },
  labelActive: {
    color: '#fff',
  },
  labelInactive: {
    color: '#5A6470',
  },
});
