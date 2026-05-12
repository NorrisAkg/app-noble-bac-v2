import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, X } from 'lucide-react-native';

interface AppBarProps {
  title: string;
  onBack?: () => void;
  onClose?: () => void;
  right?: React.ReactNode;
}

export const AppBar: React.FC<AppBarProps> = ({ title, onBack, onClose, right }) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="bg-brand-green"
      style={{ paddingTop: insets.top }}
    >
      <StatusBar style="light" />
      <View className="h-[60px] flex-row items-center px-3">
        {(onBack || onClose) && (
          <TouchableOpacity
            onPress={onBack || onClose}
            className="w-10 h-10 rounded-full bg-white/15 items-center justify-center ml-1"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {onBack ? (
              <ArrowLeft size={18} color="white" />
            ) : (
              <X size={16} color="white" />
            )}
          </TouchableOpacity>
        )}

        <View className="absolute left-0 right-0 items-center pointer-events-none" style={{ top: 0, bottom: 0, justifyContent: 'center' }}>
          <Text
            numberOfLines={1}
            className="font-poppins-semibold text-[17px] text-white"
          >
            {title}
          </Text>
        </View>

        <View className="ml-auto">
          {right}
        </View>
      </View>
    </View>
  );
};
