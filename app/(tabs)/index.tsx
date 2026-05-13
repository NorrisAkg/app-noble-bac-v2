import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { AppBar } from '@/components/ui/AppBar';
import { BookOpen, Trophy, Clock, ChevronRight } from 'lucide-react-native';

export default function HomeScreen() {
  return (
    <View className="flex-1 bg-background">
      <AppBar 
        title="Noble BAC" 
        right={
          <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center mr-2">
            <Trophy size={20} color="white" />
          </View>
        }
      />
      
      <ScrollView className="flex-1 px-5 pt-6">
        <View className="bg-white p-5 rounded-[20px] border border-line shadow-sm shadow-black/5 mb-6">
          <Text className="font-poppins-bold text-lg text-brand-ink">Bonjour ! 👋</Text>
          <Text className="font-poppins text-sm text-brand-ink-medium mt-1">
            Prêt pour ta dose de révisions quotidienne ?
          </Text>
        </View>

        <View className="flex-row gap-4 mb-6">
          <View className="flex-1 bg-brand-green/10 p-4 rounded-2xl border border-brand-green/20 items-center">
            <BookOpen size={24} color="#3DBE45" />
            <Text className="font-poppins-bold text-brand-green-dark mt-2">Cours</Text>
          </View>
          <View className="flex-1 bg-brand-salmon/10 p-4 rounded-2xl border border-brand-salmon/20 items-center">
            <Trophy size={24} color="#E8A090" />
            <Text className="font-poppins-bold text-brand-salmon-dark mt-2">Quiz</Text>
          </View>
        </View>

        <Text className="font-poppins-bold text-base text-brand-ink mb-4">Continuer l'apprentissage</Text>
        
        <View className="bg-white p-4 rounded-2xl border border-line flex-row items-center gap-4 mb-3">
          <View className="w-12 h-12 bg-slate-100 rounded-xl items-center justify-center">
            <Clock size={20} color="#5A6470" />
          </View>
          <View className="flex-1">
            <Text className="font-poppins-semibold text-sm text-brand-ink">Mathématiques</Text>
            <Text className="font-poppins text-xs text-brand-ink-light">Suites numériques • 45%</Text>
          </View>
          <ChevronRight size={20} color="#9AA3AC" />
        </View>
      </ScrollView>
    </View>
  );
}
