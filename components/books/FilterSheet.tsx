import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CustomBottomSheet } from '@/components/ui/BottomSheet';
import { Check } from 'lucide-react-native';

interface FilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  options: string[];
  selectedValue: string | null;
  onSelect: (value: string | null) => void;
}

export function FilterSheet({
  isOpen,
  onClose,
  title,
  options,
  selectedValue,
  onSelect,
}: FilterSheetProps) {
  return (
    <CustomBottomSheet isOpen={isOpen} onClose={onClose} title={title}>
      {options.map((option) => {
        const isSelected = selectedValue === option;
        
        return (
          <TouchableOpacity
            key={option}
            style={[styles.row, isSelected && styles.rowSelected]}
            onPress={() => {
              onSelect(option);
              onClose();
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.circle, isSelected && styles.circleSelected]}>
              {isSelected && <View style={styles.dot} />}
            </View>
            <Text style={[styles.label, isSelected && styles.labelSelected]}>
              {option === 'all' 
                ? (title.includes('matière') ? 'Toutes les matières' : 'Tous les auteurs') 
                : option}
            </Text>
            {isSelected && <Check size={18} color="#3DBE45" style={{ marginLeft: 'auto' }} />}
          </TouchableOpacity>
        );
      })}
    </CustomBottomSheet>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
    backgroundColor: 'transparent',
    gap: 12,
  },
  rowSelected: {
    backgroundColor: '#EAF7EB', // C.greenSoft
  },
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E6E8EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleSelected: {
    borderColor: '#3DBE45',
    backgroundColor: '#3DBE45',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  label: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: '#1A2027',
  },
  labelSelected: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#3DBE45',
  },
});
