import React from 'react';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

export type TabBarIconName = 'home' | 'courses' | 'library' | 'quiz' | 'profile';

interface TabBarIconProps {
  name: TabBarIconName;
  color: string;
  size?: number;
  strokeWidth?: number;
}

/**
 * Icônes inline pour la bottom navigation, alignées sur `shared.jsx:162-195`.
 * Remplacent les icônes `lucide-react-native` qui ne reproduisaient pas le
 * symbolisme attendu (notamment `Layers` à la place du « double livre » pour
 * Sujets).
 */
export const TabBarIcon: React.FC<TabBarIconProps> = ({
  name,
  color,
  size = 22,
  strokeWidth = 1.8,
}) => {
  switch (name) {
    case 'home':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4 11 L12 4 L20 11 V20 H14 V14 H10 V20 H4 Z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'courses':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M3 5 H10 Q12 5 12 7 V20 Q12 18 10 18 H3 Z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
          <Path
            d="M21 5 H14 Q12 5 12 7 V20 Q12 18 14 18 H21 Z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'library':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M5 5 H10 V19 H5 Z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
          <Path
            d="M13 5 H18 V19 H13 Z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'quiz':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect
            x={4}
            y={5}
            width={16}
            height={14}
            rx={3}
            stroke={color}
            strokeWidth={strokeWidth}
          />
          <Path
            d="M9 11 L11 13 L15 9"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'profile':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={9} r={3.5} stroke={color} strokeWidth={strokeWidth} />
          <Path
            d="M5 20 C5 16 8 14 12 14 C16 14 19 16 19 20"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </Svg>
      );
  }
};
