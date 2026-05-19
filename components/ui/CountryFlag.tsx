import React from 'react';
import { View } from 'react-native';
import { COUNTRIES } from '@/constants/countries';

interface CountryFlagProps {
  code: string;
  size?: number;
}

export const CountryFlag: React.FC<CountryFlagProps> = ({ code, size = 22 }) => {
  const country = COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[5];
  const colors = country.colors ?? ['#ccc', '#eee', '#aaa'];
  const w = size;
  const h = Math.round(size * 0.7);

  return (
    <View
      style={{
        width: w,
        height: h,
        borderRadius: 3,
        overflow: 'hidden',
        flexDirection: 'row',
        flexShrink: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.08,
        shadowRadius: 0,
        elevation: 1,
      }}
    >
      {colors.map((col, i) => (
        <View key={i} style={{ flex: 1, backgroundColor: col }} />
      ))}
    </View>
  );
};
