import React from 'react';
import { TouchableOpacity, View, Text, ScrollView } from 'react-native';
import { Check } from 'lucide-react-native';
import { COUNTRIES, type Country } from '@/constants/countries';
import { C } from '@/constants/theme';
import { CustomBottomSheet } from './BottomSheet';
import { CountryMap } from './CountryMap';

interface CountryPickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selected?: Country | null;
  onSelect: (country: Country) => void;
  title?: string;
}

export const CountryPickerSheet: React.FC<CountryPickerSheetProps> = ({
  isOpen,
  onClose,
  selected,
  onSelect,
  title = 'Choisis ton pays',
}) => (
  <CustomBottomSheet isOpen={isOpen} onClose={onClose} title={title} snapPoints={['70%']}>
    <ScrollView contentContainerStyle={{ paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
      {COUNTRIES.map((c) => {
        const active = selected?.code === c.code;
        return (
          <TouchableOpacity
            key={c.code}
            activeOpacity={0.7}
            onPress={() => {
              onSelect(c);
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
            <CountryMap code={c.code} size={26} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14.5, color: C.ink }}>
                {c.name}
              </Text>
              <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 12.5, color: C.ink3 }}>
                {c.dial}
              </Text>
            </View>
            {active && <Check size={20} color={C.green} strokeWidth={2.4} />}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  </CustomBottomSheet>
);
