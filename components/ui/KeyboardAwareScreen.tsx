import React from 'react';
import { ScrollView, type ScrollViewProps } from 'react-native';
import Animated, { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface KeyboardAwareScreenProps extends ScrollViewProps {
  children: React.ReactNode;
  /** Marge conservée sous le contenu, clavier fermé comme ouvert. */
  bottomPadding?: number;
}

/**
 * Contenu scrollable qui reste atteignable clavier ouvert.
 *
 * Ne pas remplacer par un `KeyboardAvoidingView` : l'app est en edge-to-edge
 * (`android.edgeToEdgeEnabled`), donc Android ne redimensionne plus la fenêtre
 * et l'`adjustResize` du manifeste n'a plus d'effet — le composant RN ne
 * compensait donc rien, et le bas des formulaires passait sous le clavier.
 *
 * `useAnimatedKeyboard` lit la hauteur du clavier via WindowInsetsAnimation,
 * qui reste correct en edge-to-edge. On la reporte sur une cale en fin de
 * contenu plutôt que sur le `contentContainerStyle` : ce dernier n'est pas une
 * cible fiable pour un style animé.
 */
export const KeyboardAwareScreen: React.FC<KeyboardAwareScreenProps> = ({
  children,
  bottomPadding = 24,
  ...scrollProps
}) => {
  const keyboard = useAnimatedKeyboard();
  const insets = useSafeAreaInsets();

  const spacerStyle = useAnimatedStyle(() => ({
    height: keyboard.height.value + bottomPadding + insets.bottom,
  }));

  return (
    <ScrollView keyboardShouldPersistTaps="handled" {...scrollProps}>
      {children}
      <Animated.View style={spacerStyle} />
    </ScrollView>
  );
};
