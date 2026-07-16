import React from 'react';
import { TouchableOpacity, View, Text, Image, ScrollView } from 'react-native';
import { Check } from 'lucide-react-native';
import { C } from '@/constants/theme';
import type { Operator } from '@/types/api';
import { CustomBottomSheet } from './BottomSheet';

interface OperatorPickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  operators: Operator[];
  selectedId?: number | null;
  onSelect: (operator: Operator) => void;
  title?: string;
}

/**
 * Sélecteur d'opérateur mobile money pour le checkout. Calqué sur
 * `CountryPickerSheet` : liste scrollable, ligne = logo (ou pastille colorée de
 * repli) + nom + coche si actif. L'opérateur choisi est transmis à
 * `initiatePayment` (operator_id) ; le serveur décide ensuite débit direct vs
 * checkout hébergé.
 */
export const OperatorPickerSheet: React.FC<OperatorPickerSheetProps> = ({
  isOpen,
  onClose,
  operators,
  selectedId,
  onSelect,
  title = 'Choisis ton opérateur',
}) => (
  <CustomBottomSheet isOpen={isOpen} onClose={onClose} title={title} snapPoints={['60%']}>
    <ScrollView contentContainerStyle={{ paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
      {operators.map((op) => {
        const active = selectedId === op.id;
        return (
          <TouchableOpacity
            key={op.id}
            activeOpacity={0.7}
            onPress={() => {
              onSelect(op);
              onClose();
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              paddingVertical: 14,
              paddingHorizontal: 16,
              borderRadius: 12,
              backgroundColor: active ? C.greenSoft : 'transparent',
            }}
          >
            <OperatorBadge operator={op} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14.5, color: C.ink }}>
                {op.name}
              </Text>
            </View>
            {active && <Check size={20} color={C.green} strokeWidth={2.4} />}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  </CustomBottomSheet>
);

const BADGE_SIZE = 36;

/** Logo signé de l'opérateur, avec repli sur une pastille colorée + initiale. */
const OperatorBadge: React.FC<{ operator: Operator }> = ({ operator }) => {
  if (operator.logo_url) {
    return (
      <Image
        source={{ uri: operator.logo_url }}
        style={{ width: BADGE_SIZE, height: BADGE_SIZE, borderRadius: 8 }}
        resizeMode="contain"
      />
    );
  }

  return (
    <View
      style={{
        width: BADGE_SIZE,
        height: BADGE_SIZE,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: operator.color ?? C.muted,
      }}
    >
      <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 15, color: C.white }}>
        {operator.name.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
};
