import React from 'react';
import { View, Text, TextStyle, StyleProp } from 'react-native';

import { TexRenderer } from '@/components/courses/TexRenderer';

interface MathTextProps {
  /** Texte brut, pouvant contenir du LaTeX délimité par `$`, `$$`, `\(` ou `\[`. */
  content: string;
  /** Taille de police (px) appliquée au rendu LaTeX comme au texte brut. */
  fontSize?: number;
  /** Alignement horizontal du rendu LaTeX et du texte brut. */
  align?: 'left' | 'center' | 'right';
  /** Couleur du texte (LaTeX et brut). */
  color?: string;
  /** Padding interne de la WebView LaTeX (ignoré pour le texte brut). */
  padding?: number;
  /** Style additionnel appliqué au `<Text>` quand le contenu n'a pas de LaTeX. */
  textStyle?: StyleProp<TextStyle>;
}

/** Détecte la présence de LaTeX (délimiteurs KaTeX) pour éviter une WebView inutile. */
const hasLatex = (str: string): boolean => /\$|\\\(|\\\[/.test(str);

const escapeHtml = (str: string): string =>
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Rend un contenu pouvant contenir des maths. Sans LaTeX, rend un simple
 * `<Text>` (zéro WebView). Avec LaTeX, délègue à `TexRenderer` en enrobant le
 * contenu dans un `<div>` stylé inline (taille, alignement, couleur) — sans
 * modifier `TexRenderer` qui injecte le contenu tel quel dans le `<body>`.
 */
export const MathText: React.FC<MathTextProps> = ({
  content,
  fontSize,
  align = 'left',
  color,
  padding,
  textStyle,
}) => {
  if (!hasLatex(content)) {
    return (
      <Text
        style={[
          textStyle,
          fontSize != null ? { fontSize } : null,
          color != null ? { color } : null,
          { textAlign: align },
        ]}
      >
        {content}
      </Text>
    );
  }

  const styleParts = [
    fontSize != null ? `font-size:${fontSize}px` : null,
    `text-align:${align}`,
    color != null ? `color:${color}` : null,
  ]
    .filter(Boolean)
    .join(';');

  const html = `<div style="${styleParts}">${escapeHtml(content)}</div>`;

  // `pointerEvents="none"` : la WebView ne capte pas les taps (l'option reste
  // cliquable) ni les gestes de défilement (le ScrollView parent défile).
  return (
    <View pointerEvents="none">
      <TexRenderer content={html} padding={padding ?? 0} />
    </View>
  );
};
