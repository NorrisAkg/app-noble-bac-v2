import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { ArrowLeft, X } from 'lucide-react-native';

interface AppBarProps {
  title: string;
  onBack?: () => void;
  onClose?: () => void;
  right?: React.ReactNode;
}

export const AppBar: React.FC<AppBarProps> = ({ title, onBack, onClose, right }) => {
  return (
    <View className="bg-brand-green">
      <SafeAreaView>
        <View className="h-[64px] flex-row items-center px-3 relative">
          {(onBack || onClose) && (
            <TouchableOpacity
              onPress={onBack || onClose}
              className="w-10 h-10 rounded-full bg-white/15 items-center justify-center ml-1"
            >
              {onBack ? (
                <ArrowLeft size={18} color="white" />
              ) : (
                <X size={16} color="white" />
              )}
            </TouchableOpacity>
          )}
          
          <View className="absolute left-14 right-14 items-center pointer-events-none">
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
      </SafeAreaView>
    </View>
  );
};
