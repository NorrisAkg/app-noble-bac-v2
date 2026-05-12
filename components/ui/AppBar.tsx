import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { styled } from 'nativewind';
import { ArrowLeft, X } from 'lucide-react-native';

interface AppBarProps {
  title: string;
  onBack?: () => void;
  onClose?: () => void;
  right?: React.ReactNode;
}

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

export const AppBar: React.FC<AppBarProps> = ({ title, onBack, onClose, right }) => {
  return (
    <StyledView className="bg-brand-green">
      <SafeAreaView>
        <StyledView className="h-[64px] flex-row items-center px-3 relative">
          {(onBack || onClose) && (
            <StyledTouchableOpacity
              onPress={onBack || onClose}
              className="w-10 h-10 rounded-full bg-white/15 items-center justify-center ml-1"
            >
              {onBack ? (
                <ArrowLeft size={18} color="white" />
              ) : (
                <X size={16} color="white" />
              )}
            </StyledTouchableOpacity>
          )}
          
          <StyledView className="absolute left-14 right-14 items-center pointer-events-none">
            <StyledText 
              numberOfLines={1}
              className="font-poppins-semibold text-[17px] text-white"
            >
              {title}
            </StyledText>
          </StyledView>

          <StyledView className="ml-auto">
            {right}
          </StyledView>
        </StyledView>
      </SafeAreaView>
    </StyledView>
  );
};
