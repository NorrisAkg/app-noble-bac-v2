import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { C } from '@/constants/theme';

export type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'caption' | 'label';

interface HeadingProps extends TextProps {
  level?: HeadingLevel;
  color?: string;
  style?: TextStyle;
}

const STYLES: Record<HeadingLevel, TextStyle> = {
  h1: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.5,
    color: C.ink,
  },
  h2: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.3,
    color: C.ink,
  },
  h3: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -0.2,
    color: C.ink,
  },
  h4: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    lineHeight: 18,
    color: C.ink,
  },
  body: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: C.ink,
  },
  caption: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    lineHeight: 16,
    color: C.ink2,
  },
  label: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.3,
    color: C.ink2,
  },
};

export const Heading: React.FC<HeadingProps> = ({
  level = 'body',
  color,
  style,
  children,
  ...rest
}) => (
  <Text style={[STYLES[level], color ? { color } : null, style]} {...rest}>
    {children}
  </Text>
);
