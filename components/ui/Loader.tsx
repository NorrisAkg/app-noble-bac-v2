import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

interface LoaderProps {
  /** Texte optionnel sous le spinner. */
  label?: string;
  /** Petit (pour usage inline) ou grand (pour usage centered). */
  size?: 'small' | 'large';
  /** Couleur du spinner. Default vert primaire. */
  color?: string;
  /** Padding vertical autour du spinner. Default 24. */
  padding?: number;
}

/**
 * Spinner standardise pour les ecrans de chargement.
 * Centralise le pattern <ActivityIndicator color="#3DBE45" /> reutilise
 * dans pratiquement tous les ecrans de la phase M-P2/M-P3/M-P5.
 */
export const Loader: React.FC<LoaderProps> = ({
  label,
  size = 'large',
  color = '#3DBE45',
  padding = 24,
}) => {
  return (
    <View style={[styles.container, { paddingVertical: padding }]}>
      <ActivityIndicator size={size} color={color} />
      {label != null && <Text style={styles.label}>{label}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: 10,
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: '#5A6470',
  },
});
