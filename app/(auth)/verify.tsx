import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { AppBar } from '@/components/ui/AppBar';
import { Button } from '@/components/ui/Button';
import { Delete } from 'lucide-react-native';
import { firebaseAuthService, FirebaseOtpError } from '@/services/firebaseAuthService';
import { verifyOtp } from '@/services/authService';
import { getApiErrorMessage } from '@/utils/apiError';

const OtpCircle = ({ filled, active }: { filled: boolean, active: boolean }) => (
  <View
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
  const { phone: rawPhone } = useLocalSearchParams<{ phone?: string }>();
  const phone = typeof rawPhone === 'string' ? rawPhone : '';

  const [code, setCode] = useState('');
  const [resendIn, setResendIn] = useState(45);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [sendingOtp, setSendingOtp] = useState(false);

  // Envoi du SMS au mount (et a chaque clic "Renvoyer le code")
  const sendOtp = useCallback(async () => {
    if (!phone) return;
    setSendingOtp(true);
    setVerificationError(null);
    try {
      const vid = await firebaseAuthService.sendVerificationCode(phone);
      setVerificationId(vid);
    } catch (e) {
      setVerificationError(
        e instanceof FirebaseOtpError ? e.message : getApiErrorMessage(e),
      );
    } finally {
      setSendingOtp(false);
    }
  }, [phone]);

  useEffect(() => {
    if (!phone) {
      Alert.alert('Erreur', 'Numéro de téléphone manquant.');
      router.back();
      return;
    }
    sendOtp();
  }, [phone, router, sendOtp]);

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

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (!verificationId) {
        throw new FirebaseOtpError('Aucune verification en cours. Redemande un code.');
      }
      const idToken = await firebaseAuthService.confirmVerificationCode(verificationId, code);
      return verifyOtp({ phone, id_token: idToken });
    },
    onSuccess: () => {
      router.replace('/(auth)/congrats');
    },
    onError: (error) => {
      const message = error instanceof FirebaseOtpError
        ? error.message
        : getApiErrorMessage(error);
      Alert.alert('Vérification échouée', message);
      setCode('');
    },
  });

  const handleVerify = () => {
    if (!isFilled || !verificationId) return;
    mutate();
  };

  const handleResend = async () => {
    setCode('');
    setResendIn(45);
    await sendOtp();
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

        {sendingOtp && (
          <View className="flex-row items-center justify-center gap-2 mt-4">
            <ActivityIndicator size="small" color="#3DBE45" />
            <Text className="font-poppins text-xs text-brand-ink-medium">
              Envoi du code en cours...
            </Text>
          </View>
        )}

        {verificationError && (
          <View className="bg-[#FBEDE8] border border-[#E14B36] rounded-xl p-3 mx-1 mt-3">
            <Text className="font-poppins-semibold text-xs text-[#A93122] mb-0.5">
              Envoi SMS impossible
            </Text>
            <Text className="font-poppins text-xs text-[#A93122] leading-4">
              {verificationError}
            </Text>
          </View>
        )}

        <View className="flex-row justify-center gap-3 my-10">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <OtpCircle key={i} filled={i < code.length} active={i === code.length} />
          ))}
        </View>

        <Button
          onPress={handleVerify}
          disabled={!isFilled || !verificationId || isPending}
          loading={isPending}
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
            <TouchableOpacity onPress={handleResend} disabled={sendingOtp}>
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
