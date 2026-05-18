import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** Texte du bouton CTA. Si absent, aucun bouton n'est affiche. */
  ctaLabel?: string;
  /** Callback du bouton CTA. Requis si ctaLabel present. */
  onCtaPress?: () => void;
  /** Variante de couleur. 'muted' (defaut) = gris doux ; 'accent' = vert primaire. */
  tone?: 'muted' | 'accent';
}

/**
 * Etat vide standardise pour les listes / sections sans donnees.
 * - Icone optionnelle (lucide-react-native).
 * - Titre + description courte.
 * - Bouton CTA optionnel (ex : "Voir les offres", "Telecharger un livre").
 *
 * Centralise le pattern utilise dans my-downloads, my-subscription, library
 * pour eviter les copier-coller.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  ctaLabel,
  onCtaPress,
  tone = 'muted',
}) => {
  return (
    <View style={styles.container}>
      {Icon != null && (
        <View style={[styles.iconWrap, tone === 'accent' ? styles.iconWrapAccent : styles.iconWrapMuted]}>
          <Icon
            size={28}
            color={tone === 'accent' ? '#3DBE45' : '#9AA3AC'}
            strokeWidth={2}
          />
        </View>
      )}
      <Text style={styles.title}>{title}</Text>
      {description != null && <Text style={styles.description}>{description}</Text>}
      {ctaLabel != null && onCtaPress != null && (
        <TouchableOpacity style={styles.ctaBtn} activeOpacity={0.85} onPress={onCtaPress}>
          <Text style={styles.ctaText}>{ctaLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconWrapMuted: { backgroundColor: '#EEF1F4' },
  iconWrapAccent: { backgroundColor: '#EAF7EB' },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    color: '#1A2027',
    textAlign: 'center',
  },
  description: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12.5,
    color: '#5A6470',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  ctaBtn: {
    marginTop: 16,
    height: 40,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: '#3DBE45',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
    color: '#fff',
  },
});
