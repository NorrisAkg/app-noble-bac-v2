import React from 'react';
import { View, ViewProps, StyleSheet, ViewStyle } from 'react-native';

interface CardProps extends ViewProps {
  /** 'soft' = ombre légère (default), 'flat' = pas d'ombre, 'elevated' = ombre plus marquée. */
  elevation?: 'soft' | 'flat' | 'elevated';
  padding?: number;
  radius?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  elevation = 'soft',
  padding = 14,
  radius = 16,
  style,
  ...rest
}) => {
  const shadow =
    elevation === 'flat' ? null
    : elevation === 'elevated' ? styles.elevated
    : styles.soft;

  return (
    <View
      style={[
        styles.base,
        shadow,
        { borderRadius: radius, padding },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E8EB',
  } as ViewStyle,
  soft: {
    shadowColor: '#1A2027',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  } as ViewStyle,
  elevated: {
    shadowColor: '#1A2027',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 5,
  } as ViewStyle,
});
