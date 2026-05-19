import React from 'react';
import { View, Image, ImageSourcePropType, ImageStyle, ViewStyle } from 'react-native';

const SOURCES: Record<string, ImageSourcePropType> = {
  BF: require('@/assets/images/countries/BF.jpg'),
  BJ: require('@/assets/images/countries/BJ.jpg'),
  CI: require('@/assets/images/countries/CI.jpg'),
  GW: require('@/assets/images/countries/GW.jpg'),
  ML: require('@/assets/images/countries/ML.jpg'),
  NE: require('@/assets/images/countries/NE.jpg'),
  SN: require('@/assets/images/countries/SN.jpg'),
  TG: require('@/assets/images/countries/TG.jpg'),
};

interface CountryMapProps {
  code: string;
  size?: number;
  style?: ImageStyle;
}

const SHADOW: ViewStyle = {
  shadowColor: '#1A2027',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.12,
  shadowRadius: 3,
  elevation: 2,
};

export const CountryMap: React.FC<CountryMapProps> = ({ code, size = 64, style }) => {
  const source = SOURCES[code];
  if (!source) return null;
  return (
    <View style={SHADOW}>
      <Image
        source={source}
        resizeMode="contain"
        accessibilityLabel={code}
        style={[{ width: size, height: size }, style]}
      />
    </View>
  );
};
