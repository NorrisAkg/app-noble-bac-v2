import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AppBar } from '@/components/ui/AppBar';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/Button';

export default function ProfileScreen() {
  const logout = useAuthStore((s) => s.logout);

  return (
    <View className="flex-1 bg-background">
      <AppBar title="Profil" showBack={false} />
      <View className="flex-1 items-center justify-center p-6">
        <Text className="font-poppins text-lg text-brand-ink text-center mb-8">Module Profil</Text>

        <Button onPress={() => logout()}>
          Déconnexion
        </Button>
      </View>
    </View>
  );
}
