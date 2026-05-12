import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AppBar } from '@/components/ui/AppBar';
import { Button } from '@/components/ui/Button';
import { Delete } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = (width - 48 - 60) / 6; // Padding and gaps

const OtpCircle = ({ filled, active }: { filled: boolean, active: boolean }) => (
  <StyledView 
    className={`w-[46px] h-[46px] rounded-full border-2 items-center justify-center bg-white ${
      filled || active ? 'border-brand-green' : 'border-[#D5DAE0]'
    } ${active ? 'shadow-sm shadow-brand-green' : ''}`}
  >
    {filled && (
      <View className="w-3 h-3 rounded-full bg-brand-green" />
    )}
  </View>
);

const KeypadKey = ({ children, onClick }: { children: React.ReactNode, onClick: () => void }) => (
  <TouchableOpacity
    onPress={onClick}
    className="flex-1 h-16 bg-white rounded-xl m-1 items-center justify-center shadow-sm shadow-black/5 active:bg-slate-100"
  >
    <Text className="font-poppins-medium text-[26px] text-brand-ink">
      {children}
    </Text>
  </TouchableOpacity>
);

export default function VerifyScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams();
  const [code, setCode] = useState('');
  const [resendIn, setResendIn] = useState(45);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setInterval(() => setResendIn((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [resendIn]);

  const press = (d: string) => {
    if (code.length >= 6) return;
    setCode((c) => c + d);
  };
  
  const back = () => setCode((c) => c.slice(0, -1));

  const isFilled = code.length === 6;

  const handleVerify = () => {
    if (!isFilled) return;
    router.push('/(auth)/congrats');
  };

  return (
    <View className="flex-1 bg-white">
      <AppBar title="" onBack={() => router.back()} />
      
      <View className="flex-1 px-6 pt-10">
        <Text className="text-center font-poppins-extrabold text-[30px] text-brand-ink tracking-tighter">
          Vérification
        </Text>
        <Text className="text-center font-poppins text-[14.5px] text-brand-ink-medium mt-3 leading-5">
          Saisis le code à 6 chiffres envoyé au{'\n'}
          <Text className="font-poppins-medium">{phone || '+225 01 XX XX XX'}</Text>
        </Text>

        <View className="flex-row justify-center gap-3 my-10">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <OtpCircle key={i} filled={i < code.length} active={i === code.length} />
          ))}
        </View>

        <Button 
          onPress={handleVerify} 
          disabled={!isFilled}
          className={!isFilled ? 'bg-[#C7CCD2]' : ''}
        >
          VÉRIFIER
        </Button>

        <View className="items-center mt-5">
          {resendIn > 0 ? (
            <Text className="font-poppins-semibold text-xs text-[#B8BDC4] tracking-[1.5px] uppercase">
              RENVOYER LE CODE ({resendIn}s)
            </Text>
          ) : (
            <TouchableOpacity onPress={() => { setResendIn(45); setCode(''); }}>
              <Text className="font-poppins-bold text-xs text-brand-green tracking-[1.5px] uppercase">
                RENVOYER LE CODE
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View className="bg-[#ECEEF0] p-1.5 pb-8">
        {[
          ['1', '2', '3'],
          ['4', '5', '6'],
          ['7', '8', '9'],
          ['', '0', 'back'],
        ].map((row, ri) => (
          <View key={ri} className="flex-row">
            {row.map((k, ki) => {
              if (k === '') return <View key={ki} className="flex-1 m-1" />;
              if (k === 'back') {
                return (
                  <TouchableOpacity
                    key={ki}
                    onPress={back}
                    className="flex-1 h-16 bg-white rounded-xl m-1 items-center justify-center shadow-sm shadow-black/5 active:bg-slate-100"
                  >
                    <Delete size={26} color="#1A2027" />
                  </TouchableOpacity>
                );
              }
              return (
                <KeypadKey key={ki} onClick={() => press(k)}>{k}</KeypadKey>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
