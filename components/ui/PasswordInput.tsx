import React, { useState } from 'react';
import { TouchableOpacity, TextInputProps } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

import { Input } from './Input';

interface PasswordInputProps extends Omit<TextInputProps, 'secureTextEntry'> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
}

/**
 * Champ mot de passe avec bouton de révélation.
 *
 * Le mot de passe n'est plus un PIN à 4 chiffres saisi au pavé numérique mais
 * une chaîne d'au moins 8 caractères : sans possibilité de relire ce qu'on
 * tape, le taux d'échec à la saisie sur clavier mobile devient le premier
 * point d'abandon de l'inscription.
 */
export const PasswordInput: React.FC<PasswordInputProps> = ({
  label,
  error,
  helperText,
  containerClassName,
  ...props
}) => {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <Input
      label={label}
      error={error}
      helperText={helperText}
      containerClassName={containerClassName}
      secureTextEntry={!isRevealed}
      autoCapitalize="none"
      autoCorrect={false}
      // Sans ça, iOS propose d'enregistrer un mot de passe fort qui écrase la
      // saisie en cours, et Android déclenche la correction orthographique sur
      // un champ révélé.
      autoComplete="password"
      textContentType="password"
      rightIcon={
        <TouchableOpacity
          onPress={() => setIsRevealed((revealed) => !revealed)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel={isRevealed ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        >
          {isRevealed ? (
            <EyeOff size={20} color="#5A6470" />
          ) : (
            <Eye size={20} color="#5A6470" />
          )}
        </TouchableOpacity>
      }
      {...props}
    />
  );
};
