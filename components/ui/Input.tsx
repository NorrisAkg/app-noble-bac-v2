import React, { useState } from 'react';
import { View, TextInput, Text, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  /** Élément affiché à gauche du champ (indicatif pays, icône…). */
  icon?: React.ReactNode;
  /**
   * Élément affiché à droite du champ, à l'intérieur de la bordure. Sert
   * notamment au bouton œil de PasswordInput.
   */
  rightIcon?: React.ReactNode;
  /**
   * Message d'erreur sous le champ. Sa présence colore aussi la bordure : sans
   * ça, chaque écran réimplémentait son propre affichage d'erreur, et la
   * plupart se contentaient de vider `fieldErrors` sans jamais le rendre.
   */
  error?: string;
  /** Texte d'aide affiché sous le champ, masqué dès qu'une erreur s'affiche. */
  helperText?: string;
  containerClassName?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  icon,
  rightIcon,
  error,
  helperText,
  containerClassName = '',
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'none',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const hasError = !!error;

  // L'erreur prime sur le focus : un champ invalide reste signalé pendant
  // qu'on le corrige, sinon la bordure redevient verte au premier caractère
  // et l'utilisateur croit avoir résolu le problème.
  const borderClassName = hasError
    ? 'border-brand-danger'
    : isFocused
      ? 'border-brand-green'
      : 'border-line';

  return (
    <View className={`mb-4 ${containerClassName}`}>
      {label && (
        <Text className="font-poppins-semibold text-[12px] text-brand-ink-medium tracking-[0.3px] mb-1.5">
          {label}
        </Text>
      )}
      <View
        className={`flex-row items-center w-full h-[54px] px-4 bg-white border-[1.5px] rounded-[14px] ${borderClassName}`}
      >
        {icon && <View className="mr-3 opacity-60">{icon}</View>}
        <TextInput
          className="flex-1 font-poppins text-[15px] text-brand-ink"
          placeholder={placeholder}
          placeholderTextColor="#9AA3AC"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {rightIcon && <View className="ml-2">{rightIcon}</View>}
      </View>

      {hasError ? (
        <Text className="font-poppins text-[12px] text-brand-danger mt-1.5">{error}</Text>
      ) : helperText ? (
        <Text className="font-poppins text-[12px] text-brand-ink-medium mt-1.5">{helperText}</Text>
      ) : null}
    </View>
  );
};
