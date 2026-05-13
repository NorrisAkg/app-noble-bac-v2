import React from 'react';
import { View, Text } from 'react-native';
import { AppBar } from '@/components/ui/AppBar';

export default function QuizScreen() {
  return (
    <View className="flex-1 bg-background">
      <AppBar title="Quiz" showBack={false} />
      <View className="flex-1 items-center justify-center p-6">
        <Text className="font-poppins text-lg text-brand-ink text-center">Module Quiz</Text>
        <Text className="font-poppins text-sm text-brand-ink-medium text-center mt-2">Bientôt disponible</Text>
      </View>
    </View>
  );
}
