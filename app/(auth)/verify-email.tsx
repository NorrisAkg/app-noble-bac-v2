import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { Delete } from 'lucide-react-native';
import { AppBar } from '@/components/ui/AppBar';
import { Button } from '@/components/ui/Button';
import { verifyEmail, resendEmailCode } from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';
import { getApiErrorMessage } from '@/utils/apiError';

const CODE_LENGTH = 6;
const RESEND_DELAY_SECONDS = 45;

const CodeCircle = ({ filled, active }: { filled: boolean; active: boolean }) => (
  <View
    className={`w-[46px] h-[46px] rounded-full border-2 items-center justify-center bg-white ${
      filled || active ? 'border-brand-green' : 'border-[#D5DAE0]'
    }`}
  >
    {filled && <View className="w-3 h-3 rounded-full bg-brand-green" />}
  </View>
);

const KeypadKey = ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
  <TouchableOpacity
    onPress={onClick}
    className="flex-1 h-16 bg-white rounded-xl m-1 items-center justify-center shadow-sm shadow-black/5 active:bg-slate-100"
  >
    <Text className="font-poppins-medium text-[26px] text-brand-ink">{children}</Text>
  </TouchableOpacity>
);

/**
 * Vérification du compte par code email.
 *
 * Écran distinct de `verify.tsx`, qui reste dédié à l'OTP téléphone des
 * comptes créés avant la refonte : les deux appellent des endpoints différents
 * et n'ont pas le même identifiant en entrée.
 */
export default function VerifyEmailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { email: rawEmail } = useLocalSearchParams<{ email?: string }>();
  const email = typeof rawEmail === 'string' ? rawEmail : '';

  const setAuth = useAuthStore((s) => s.setAuth);

  const [code, setCode] = useState('');
  const [resendIn, setResendIn] = useState(RESEND_DELAY_SECONDS);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendConfirmed, setResendConfirmed] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!email) {
      Alert.alert('Erreur', 'Adresse email manquante.');
      router.back();
    }
  }, [email, router]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setInterval(() => setResendIn((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [resendIn]);

  const press = (digit: string) => {
    if (code.length >= CODE_LENGTH) return;
    setCode((c) => c + digit);
  };

  const backspace = () => setCode((c) => c.slice(0, -1));

  const isFilled = code.length === CODE_LENGTH;

  const { mutate, isPending } = useMutation({
    mutationFn: () => verifyEmail({ email, code }),
    onSuccess: (res) => {
      // ORDRE CRITIQUE : naviguer AVANT setAuth.
      //
      // Avec `await setAuth(...)` puis `router.replace`, le store passerait à
      // isAuthenticated=true alors que segments vaut encore
      // ['(auth)', 'verify-email']. Le garde de _layout.tsx redirigerait vers
      // /(tabs) (segments[1] !== 'congrats'), court-circuitant la navigation
      // vers congrats : l'utilisateur verrait un flash puis l'accueil, sans
      // passer par /setup.
      //
      // En naviguant d'abord, segments vaut ['(auth)', 'congrats'] avant que
      // setAuth ne mute isAuthenticated, et l'exception du garde s'applique.
      router.replace('/(auth)/congrats');
      void setAuth(res.data.user, res.data.access_token, res.data.refresh_token);
    },
    onError: (error) => {
      Alert.alert('Vérification échouée', getApiErrorMessage(error));
      setCode('');
    },
  });

  const handleVerify = () => {
    if (!isFilled || isPending) return;
    mutate();
  };

  const handleResend = useCallback(async () => {
    if (!email || isResending) return;

    setCode('');
    setResendIn(RESEND_DELAY_SECONDS);
    setIsResending(true);
    setResendError(null);
    setResendConfirmed(false);

    try {
      await resendEmailCode({ email });
      // Le backend répond 200 que l'adresse existe ou non : on ne peut donc
      // pas affirmer qu'un code est parti, seulement que la demande est
      // passée. Le message reste volontairement conditionnel.
      setResendConfirmed(true);
    } catch (e) {
      setResendError(getApiErrorMessage(e));
    } finally {
      setIsResending(false);
    }
  }, [email, isResending]);

  return (
    <View className="flex-1 bg-white">
      <AppBar title="" onBack={() => router.back()} />

      <View className="flex-1 px-6 pt-10">
        <Text className="text-center font-poppins-extrabold text-[30px] text-brand-ink tracking-tighter">
          Vérification
        </Text>
        <Text className="text-center font-poppins text-[14.5px] text-brand-ink-medium mt-3 leading-5">
          Saisis le code à 6 chiffres envoyé à{'\n'}
          <Text className="font-poppins-medium">{email}</Text>
        </Text>

        {isResending && (
          <View className="flex-row items-center justify-center gap-2 mt-4">
            <ActivityIndicator size="small" color="#3DBE45" />
            <Text className="font-poppins text-xs text-brand-ink-medium">
              Envoi du code en cours…
            </Text>
          </View>
        )}

        {resendConfirmed && !isResending && (
          <Text className="text-center font-poppins text-xs text-brand-ink-medium mt-4">
            Si un compte non vérifié existe pour cette adresse, un code vient d&apos;être envoyé.
            Pense à regarder dans les spams.
          </Text>
        )}

        {resendError && (
          <View className="bg-brand-danger-soft border border-brand-danger rounded-xl p-3 mx-1 mt-3">
            <Text className="font-poppins-semibold text-xs text-brand-danger mb-0.5">
              Envoi impossible
            </Text>
            <Text className="font-poppins text-xs text-brand-danger leading-4">{resendError}</Text>
          </View>
        )}

        <View className="flex-row justify-center gap-3 my-10">
          {Array.from({ length: CODE_LENGTH }, (_, i) => (
            <CodeCircle key={i} filled={i < code.length} active={i === code.length} />
          ))}
        </View>

        <Button
          onPress={handleVerify}
          disabled={!isFilled || isPending}
          loading={isPending}
          shape="rounded"
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
            <TouchableOpacity onPress={handleResend} disabled={isResending}>
              <Text className="font-poppins-bold text-xs text-brand-green tracking-[1.5px] uppercase">
                RENVOYER LE CODE
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View className="bg-[#ECEEF0] p-1.5" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
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
                    onPress={backspace}
                    accessibilityRole="button"
                    accessibilityLabel="Effacer le dernier chiffre"
                    className="flex-1 h-16 bg-white rounded-xl m-1 items-center justify-center shadow-sm shadow-black/5 active:bg-slate-100"
                  >
                    <Delete size={26} color="#1A2027" />
                  </TouchableOpacity>
                );
              }
              return (
                <KeypadKey key={ki} onClick={() => press(k)}>
                  {k}
                </KeypadKey>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
