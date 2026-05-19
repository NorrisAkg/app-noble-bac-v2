import React from 'react';
import { View, Image, ImageStyle, ViewStyle } from 'react-native';

const SOURCE = require('@/assets/images/logo.png');

interface LogoProps {
  size?: number;
  style?: ImageStyle;
  withShadow?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 88, style, withShadow = true }) => {
  const wrapperShadow: ViewStyle | undefined = withShadow
    ? {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 18,
        elevation: 6,
      }
    : undefined;

  return (
    <View style={wrapperShadow}>
      <Image
        source={SOURCE}
        resizeMode="contain"
        accessibilityLabel="Le Noble BAC"
        style={[{ width: size, height: size }, style]}
      />
    </View>
  );
};

export const LogoMini: React.FC<Omit<LogoProps, 'withShadow'>> = ({ size = 32, style }) => (
  <Image
    source={SOURCE}
    resizeMode="contain"
    accessibilityLabel=""
    style={[{ width: size, height: size }, style]}
  />
);
