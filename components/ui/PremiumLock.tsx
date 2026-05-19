import React from 'react';
import Svg, { Rect, Path, Circle } from 'react-native-svg';
import { C } from '@/constants/theme';

interface PremiumLockProps {
  size?: number;
  color?: string;
  fill?: string;
}

export const PremiumLock: React.FC<PremiumLockProps> = ({
  size = 16,
  color = C.salmon,
  fill = C.salmonSoft,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x={5} y={11} width={14} height={10} rx={2} stroke={color} strokeWidth={2} fill={fill} />
    <Path
      d="M8 11V7a4 4 0 0 1 8 0v4"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Circle cx={12} cy={16} r={1.5} fill={color} />
  </Svg>
);
