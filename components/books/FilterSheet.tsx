import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Check } from 'lucide-react-native';
import { CustomBottomSheet } from '@/components/ui/BottomSheet';
import { C } from '@/constants/theme';

interface FilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  /**
   * Liste des valeurs filtrables (sans option « Toutes » — celle-ci est
   * ajoutée automatiquement en tête de liste pour permettre de
   * réinitialiser depuis le sheet).
   */
  options: string[];
  /** Valeur sélectionnée actuelle, ou `null` si « Toutes » est actif. */
  selectedValue: string | null;
  /**
   * Callback. Reçoit `null` quand l'utilisateur tape sur « Toutes »,
   * sinon la valeur exacte sélectionnée.
   */
  onSelect: (value: string | null) => void;
  /**
   * Libellé de l'option « Toutes » (ex. « Toutes les matières »,
   * « Tous les auteurs »). Par défaut « Toutes les valeurs ».
   */
  allLabel?: string;
}

export function FilterSheet({
  isOpen,
  onClose,
  title,
  options,
  selectedValue,
  onSelect,
  allLabel = 'Toutes les valeurs',
}: FilterSheetProps) {
  const renderRow = (label: string, value: string | null) => {
    const isSelected = selectedValue === value;
    return (
      <TouchableOpacity
        key={label}
        style={[styles.row, isSelected && styles.rowSelected]}
        onPress={() => {
          onSelect(value);
          onClose();
        }}
        activeOpacity={0.7}
      >
        <View style={[styles.circle, isSelected && styles.circleSelected]}>
          {isSelected && <View style={styles.dot} />}
        </View>
        <Text
          style={[styles.label, isSelected && styles.labelSelected]}
          numberOfLines={1}
        >
          {label}
        </Text>
        {isSelected && <Check size={18} color={C.green} style={styles.checkMark} />}
      </TouchableOpacity>
    );
  };

  return (
    <CustomBottomSheet isOpen={isOpen} onClose={onClose} title={title}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderRow(allLabel, null)}
        {options.map((option) => renderRow(option, option))}
      </ScrollView>
    </CustomBottomSheet>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 12,
  },
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
    backgroundColor: C.greenSoft,
  },
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleSelected: {
    borderColor: C.green,
    backgroundColor: C.green,
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
    color: C.ink,
    flex: 1,
  },
  labelSelected: {
    fontFamily: 'Poppins_600SemiBold',
    color: C.green,
  },
  checkMark: {
    marginLeft: 'auto',
  },
});
