import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Ellipse, Path, Rect, Circle } from 'react-native-svg';

interface GraduationCapProps {
  size?: number;
}

export const GraduationCap: React.FC<GraduationCapProps> = ({ size = 78 }) => (
  <Svg width={size} height={size} viewBox="0 0 96 96" fill="none">
    <Defs>
      <LinearGradient id="capG" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0%" stopColor="#3D2A60" />
        <Stop offset="100%" stopColor="#241638" />
      </LinearGradient>
    </Defs>
    <Ellipse cx={48} cy={58} rx={26} ry={8} fill="#241638" opacity={0.25} />
    <Path d="M22 50 L48 38 L74 50 L48 62 Z" fill="url(#capG)" />
    <Path d="M22 50 L48 62 L74 50 L74 56 L48 68 L22 56 Z" fill="#1A0E2A" opacity={0.6} />
    <Rect
      x={14}
      y={42}
      width={68}
      height={6}
      rx={1}
      fill="url(#capG)"
      transform="rotate(-2 48 45)"
    />
    <Path d="M74 50 L80 64" stroke="#F4A82C" strokeWidth={2.5} strokeLinecap="round" />
    <Circle cx={80} cy={66} r={4} fill="#F4A82C" />
    <Circle cx={80} cy={66} r={4} fill="#E08A14" opacity={0.4} />
  </Svg>
);
