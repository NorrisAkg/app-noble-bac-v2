import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { AppBar } from '@/components/ui/AppBar';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { CustomBottomSheet } from '@/components/ui/BottomSheet';
import { Check, ChevronDown } from 'lucide-react-native';
import { COUNTRIES, DEFAULT_COUNTRY } from '@/constants/countries';

export default function SignupScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const isValid = firstName && lastName && phone.length >= 6 && password.length >= 8 && agree;

  const handleSignup = () => {
    if (!isValid) return;
    setSubmitting(true);
    // Simulation -> Redirect to verify
    setTimeout(() => {
      setSubmitting(false);
      router.push({
        pathname: '/(auth)/verify',
        params: { phone: `${country.dial} ${phone}` }
      });
    }, 1000);
  };

  return (
    <View className="flex-1 bg-background">
      <AppBar title="Créer un compte" onBack={() => router.back()} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-6 pt-6">
          <Text className="font-poppins-bold text-[22px] text-brand-ink tracking-tighter">
            Bienvenue dans Noble BAC
          </Text>
          <Text className="font-poppins text-[13.5px] text-brand-ink-medium mt-1 mb-5 leading-5">
            Quelques infos pour personnaliser ton parcours.
          </Text>

          <View className="flex-row gap-3">
            <Input 
              containerClassName="flex-1"
              placeholder="Prénom"
              value={firstName}
              onChangeText={setFirstName}
            />
            <Input 
              containerClassName="flex-1"
              placeholder="Nom"
              value={lastName}
              onChangeText={setLastName}
            />
          </View>

          <Input 
            label="Numéro de téléphone"
            placeholder="90 12 34 56"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            icon={
              <TouchableOpacity 
                onPress={() => setIsPickerOpen(true)}
                className="flex-row items-center gap-1.5 pr-2 border-r border-line"
              >
                <Text className="font-poppins-semibold text-sm text-brand-ink">
                  {country.dial}
                </Text>
                <ChevronDown size={14} color="#5A6470" />
              </TouchableOpacity>
            }
          />

          <Input 
            placeholder="Mot de passe (8 caractères min)"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity 
            onPress={() => setAgree(!agree)}
            className="flex-row items-start gap-2.5 mt-2 mb-6"
          >
            <View className={`w-[22px] h-[22px] rounded-md border-[1.5px] items-center justify-center ${
              agree ? 'bg-brand-green border-brand-green' : 'bg-white border-line'
            }`}>
              {agree && <Check size={14} color="white" strokeWidth={3} />}
            </View>
            <Text className="flex-1 font-poppins text-[12.5px] text-brand-ink-medium leading-5">
              J'accepte les <Text className="text-brand-green font-poppins-semibold">conditions d'utilisation</Text> et la <Text className="text-brand-green font-poppins-semibold">politique de confidentialité</Text>.
            </Text>
          </TouchableOpacity>

          <Button 
            onPress={handleSignup} 
            disabled={!isValid || submitting}
            loading={submitting}
          >
            Créer mon compte
          </Button>

          <View className="mt-6 mb-10 flex-row justify-center gap-1">
            <Text className="font-poppins text-[13.5px] text-brand-ink-medium">
              Déjà inscrit ?
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text className="font-poppins-semibold text-[13.5px] text-brand-green">
                Se connecter
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomBottomSheet 
        isOpen={isPickerOpen} 
        onClose={() => setIsPickerOpen(false)}
        title="Choisis ton pays"
      >
        <ScrollView className="px-2">
          {COUNTRIES.map((c) => (
            <TouchableOpacity 
              key={c.code}
              onPress={() => { setCountry(c); setIsPickerOpen(false); }}
              className={`flex-row items-center gap-3.5 p-4 rounded-xl ${
                c.code === country.code ? 'bg-brand-green/10' : 'bg-transparent'
              }`}
            >
              <View className="w-10 h-10 bg-brand-green/5 rounded-full items-center justify-center">
                 <Text className="text-lg">{c.code === 'BJ' ? '🇧🇯' : c.code === 'BF' ? '🇧🇫' : c.code === 'CI' ? '🇨🇮' : c.code === 'ML' ? '🇲🇱' : c.code === 'NE' ? '🇳🇪' : c.code === 'SN' ? '🇸🇳' : '🇹🇬'}</Text>
              </View>
              <View className="flex-1">
                <Text className="font-poppins-semibold text-[14.5px] text-brand-ink">
                  {c.name}
                </Text>
                <Text className="font-poppins text-xs text-brand-ink-light">
                  {c.dial}
                </Text>
              </View>
              {c.code === country.code && <Check size={20} color="#3DBE45" strokeWidth={2.4} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </CustomBottomSheet>
    </View>
  );
}
