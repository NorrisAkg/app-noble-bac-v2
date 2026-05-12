import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { AppBar } from '@/components/ui/AppBar';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Eye, EyeOff, ChevronDown } from 'lucide-react-native';
import { COUNTRIES } from '@/constants/countries';

export default function LoginScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [country, setCountry] = useState({ code: 'NE', name: 'Niger', dial: '+227' }); // Default Niger as per templates

  const isValid = phone.length >= 6 && password.length >= 4;

  const handleLogin = async () => {
    if (!isValid) return;
    setSubmitting(true);
    // Simulation
    setTimeout(() => {
      setSubmitting(false);
      router.replace('/(tabs)');
    }, 1000);
  };

  return (
    <View className="flex-1 bg-background">
      <AppBar title="Connexion" onBack={() => router.back()} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-6 pt-7">
          <Text className="font-poppins-bold text-2xl text-brand-ink tracking-tighter">
            Bon retour 👋
          </Text>
          <Text className="font-poppins text-sm text-brand-ink-medium mt-1.5 mb-6 leading-5">
            Connecte-toi pour reprendre tes révisions là où tu les as laissées.
          </Text>

          <Input 
            label="Numéro de téléphone"
            placeholder="90 12 34 56"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            icon={
              <TouchableOpacity className="flex-row items-center gap-1.5 pr-2 border-r border-line">
                <Text className="font-poppins-semibold text-sm text-brand-ink">
                  {country.dial}
                </Text>
                <ChevronDown size={14} color="#5A6470" />
              </TouchableOpacity>
            }
          />

          <Input 
            label="Mot de passe"
            placeholder="••••••••"
            secureTextEntry={!showPwd}
            value={password}
            onChangeText={setPassword}
            icon={
              <TouchableOpacity onPress={() => setShowPwd(!showPwd)}>
                {showPwd ? <EyeOff size={20} color="#5A6470" /> : <Eye size={20} color="#5A6470" />}
              </TouchableOpacity>
            }
          />

          <TouchableOpacity 
            className="self-end mb-6"
            onPress={() => router.push('/(auth)/forgot')}
          >
            <Text className="font-poppins-semibold text-xs text-brand-green">
              Mot de passe oublié ?
            </Text>
          </TouchableOpacity>

          <Button 
            onPress={handleLogin} 
            disabled={!isValid || submitting}
            loading={submitting}
          >
            Se connecter
          </Button>

          <View className="mt-6 flex-row justify-center gap-1">
            <Text className="font-poppins text-[13.5px] text-brand-ink-medium">
              Nouveau ici ?
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
              <Text className="font-poppins-semibold text-[13.5px] text-brand-green">
                Créer un compte
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
