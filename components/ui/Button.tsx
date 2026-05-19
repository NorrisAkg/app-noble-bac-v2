import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
  shape?: 'pill' | 'rounded';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  style?: ViewStyle;
  textClassName?: string;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  variant = 'primary',
  shape = 'pill',
  disabled = false,
  loading = false,
  className = '',
  style,
  textClassName = '',
  textStyle,
}) => {
  const isPrimary = variant === 'primary';
  const radiusClass = shape === 'pill' ? 'rounded-full' : 'rounded-[12px]';

  const baseClassName = `w-full h-[52px] ${radiusClass} flex-row items-center justify-center`;
  const primaryClassName = disabled 
    ? "bg-brand-green/40 shadow-none" 
    : "bg-brand-green shadow-lg shadow-brand-green/50";
  const ghostClassName = "bg-transparent border-[1.5px] border-brand-green";

  const variantClassName = isPrimary ? primaryClassName : ghostClassName;
  
  const baseTextClassName = "font-poppins-semibold text-[15px] tracking-[0.2px]";
  const primaryTextClassName = "text-white";
  const ghostTextClassName = "text-brand-green";
  
  const variantTextClassName = isPrimary ? primaryTextClassName : ghostTextClassName;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      className={`${baseClassName} ${variantClassName} ${className}`}
      style={style}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? "white" : "#3DBE45"} />
      ) : (
        <Text 
          className={`${baseTextClassName} ${variantTextClassName} ${textClassName}`}
          style={textStyle}
        >
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
};
