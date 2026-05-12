import React, { useState } from 'react';
import { View, TextInput, Text, ViewStyle, TextInputProps } from 'react-native';
import { styled } from 'nativewind';

interface InputProps extends TextInputProps {
  label?: string;
  icon?: React.ReactNode;
  containerClassName?: string;
}

const StyledView = styled(View);
const StyledTextInput = styled(TextInput);
const StyledText = styled(Text);

export const Input: React.FC<InputProps> = ({
  label,
  icon,
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

  return (
    <StyledView className={`mb-4 ${containerClassName}`}>
      {label && (
        <StyledText className="font-poppins-semibold text-[12px] text-brand-ink-medium tracking-[0.3px] mb-1.5 uppercase">
          {label}
        </StyledText>
      )}
      <StyledView 
        className={`flex-row items-center w-full h-[54px] px-4 bg-white border-[1.5px] rounded-[14px] ${
          isFocused ? 'border-brand-green' : 'border-line'
        }`}
      >
        {icon && <StyledView className="mr-3 opacity-60">{icon}</StyledView>}
        <StyledTextInput
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
      </StyledView>
    </StyledView>
  );
};
