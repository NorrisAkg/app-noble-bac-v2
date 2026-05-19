import React from 'react';
import { View, Text, ViewStyle, TextStyle, StyleSheet } from 'react-native';
import { C } from '@/constants/theme';

export type BadgeVariant = 'green' | 'salmon' | 'danger' | 'warning' | 'info' | 'premium' | 'neutral';
export type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  uppercase?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const PALETTE: Record<BadgeVariant, { bg: string; fg: string }> = {
  green:    { bg: C.greenSoft,   fg: C.greenDark },
  salmon:   { bg: C.salmonSoft,  fg: C.salmonDark },
  danger:   { bg: C.dangerSoft,  fg: C.danger },
  warning:  { bg: C.warningSoft, fg: '#8C6A00' },
  info:     { bg: C.infoSoft,    fg: C.info },
  premium:  { bg: C.salmonSoft,  fg: C.salmonDark },
  neutral:  { bg: '#F2F4F6',     fg: C.ink2 },
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'green',
  size = 'md',
  uppercase = false,
  style,
  textStyle,
}) => {
  const { bg, fg } = PALETTE[variant];
  const isSm = size === 'sm';
  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: bg,
          paddingHorizontal: isSm ? 6 : 8,
          paddingVertical: isSm ? 2 : 3,
        },
        style,
      ]}
    >
      <Text
        style={[
          {
            color: fg,
            fontFamily: 'Poppins_700Bold',
            fontSize: isSm ? 9 : 11,
            letterSpacing: uppercase ? 1 : 0.2,
            textTransform: uppercase ? 'uppercase' : 'none',
          },
          textStyle,
        ]}
      >
        {children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
});
