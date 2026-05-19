import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Path } from 'react-native-svg';

interface DiamondIconProps {
  size?: number;
  /** Si fourni, génère un id unique pour le gradient (utile si plusieurs Diamond sur le même écran). */
  gradientId?: string;
}

/**
 * Diamant orangé avec gradient `#FFB876 → #E8624C`, bordure foncée et lignes
 * diagonales blanches, aligné `templates/screens-courses.jsx:92-104`.
 * Utilisé dans `TabChips` (Cours) et `library.tsx` (Épreuve/Corrigé/Vidéo).
 */
export const DiamondIcon: React.FC<DiamondIconProps> = ({ size = 14, gradientId = 'dmd' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0%" stopColor="#FFB876" />
        <Stop offset="100%" stopColor="#E8624C" />
      </LinearGradient>
    </Defs>
    <Path
      d="M12 3 L20 10 L12 21 L4 10 Z"
      fill={`url(#${gradientId})`}
      stroke="#C8451A"
      strokeWidth={0.6}
      strokeLinejoin="round"
    />
    <Path
      d="M4 10 L20 10 M12 3 L8 10 L12 21 M12 3 L16 10 L12 21"
      stroke="rgba(255,255,255,0.55)"
      strokeWidth={0.8}
      fill="none"
    />
  </Svg>
);
