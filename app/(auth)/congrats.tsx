import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Star } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.86;

const TESTIMONIALS = [
  {
    name: 'Fatou Traoré',  level: 'BTS 2025', avatar: 'FT',
    quote: "Les examens blancs m'ont donné confiance.",
  },
  {
    name: 'Moussa Sow',    level: 'Bac S — 2024', avatar: 'MS',
    quote: "Les fiches sont claires, j'ai gagné des points.",
  },
  {
    name: 'Awa Diop',      level: 'Bac L — 2024', avatar: 'AD',
    quote: "J'ai révisé partout, même hors connexion.",
  },
];

const TestimonialCard = ({ item }: { item: typeof TESTIMONIALS[0] }) => (
  <View 
    style={{ width: CARD_WIDTH }}
    className="bg-white border border-line rounded-[18px] p-5 items-center shadow-sm shadow-black/5 mx-1.5"
  >
    <View className="flex-row items-center w-full gap-3.5">
      <View className="w-16 h-16 rounded-full border-[2.5px] border-brand-green bg-brand-green/10 items-center justify-center">
        <Text className="font-poppins-bold text-[22px] text-brand-green-dark">
          {item.avatar}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="font-poppins-bold text-[17px] text-brand-ink tracking-tight">
          {item.name}
        </Text>
        <Text className="font-poppins text-xs text-brand-ink-light mt-0.5">
          {item.level}
        </Text>
        <View className="flex-row gap-1.5 mt-2">
          <View className="px-2.5 py-0.5 rounded-full bg-brand-green/10">
            <Text className="font-poppins-semibold text-[11.5px] text-brand-green-dark">Admise</Text>
          </View>
          <View className="px-2.5 py-0.5 rounded-full bg-[#FCEFE6]">
            <Text className="font-poppins-semibold text-[11.5px] text-[#D26B2B]">Félicitations</Text>
          </View>
        </View>
      </View>
    </View>

    <View className="flex-row gap-0.5 my-3">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} size={18} fill="#F5C518" color="#F5C518" />
      ))}
    </View>

    <Text className="font-poppins italic text-[13.5px] text-brand-ink-medium text-center leading-5 px-2">
      “{item.quote}”
    </Text>
  </View>
);

export default function CongratsScreen() {
  const router = useRouter();
  const [activeIdx, setActiveIdx] = useState(0);

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / CARD_WIDTH);
    setActiveIdx(index);
  };

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1 pt-6">
          <View className="items-center px-6">
            <View className="w-[148px] h-[148px] rounded-full border-[3px] border-brand-green bg-brand-green/10 items-center justify-center relative">
               <Text className="absolute -top-1 -left-7 text-[28px] -rotate-12">🎉</Text>
               <Text className="absolute top-0 -right-8 text-[28px] rotate-12">🎊</Text>
               
               {/* Graduation cap icon fallback */}
               <Text className="text-6xl">🎓</Text>
            </View>

            <Text className="font-poppins-extrabold text-[28px] text-brand-ink mt-6 text-center">
              Félicitations !
            </Text>
            <Text className="font-poppins text-sm text-brand-ink-medium text-center mt-2.5 leading-5 px-2">
              Votre compte est prêt. Commencez dès maintenant à réviser et à progresser vers vos objectifs.
            </Text>

            <View className="flex-row items-center gap-2 mt-7 mb-1">
               <Text className="text-lg">🎓</Text>
               <Text className="font-poppins-bold text-[17px] text-brand-green">
                 Nos meilleurs élèves
               </Text>
            </View>
            <Text className="font-poppins text-xs text-brand-ink-light mb-5">
              Ils ont réussi grâce à leur discipline.
            </Text>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            snapToInterval={CARD_WIDTH + 12} // card width + margins
            decelerationRate="fast"
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          >
            {TESTIMONIALS.map((t, i) => (
              <TestimonialCard key={i} item={t} />
            ))}
          </ScrollView>

          <View className="flex-row justify-center gap-2 mt-4 mb-8">
            {TESTIMONIALS.map((_, i) => (
              <View 
                key={i} 
                className={`h-2 rounded-full transition-all ${
                  i === activeIdx ? 'w-[22px] bg-brand-green' : 'w-2 bg-[#D5DAE0]'
                }`} 
              />
            ))}
          </View>
        </ScrollView>

        <View className="p-5 pb-8 bg-white">
          <Button onPress={() => router.replace('/(tabs)')}>
            Commencer maintenant
          </Button>
        </View>
      </SafeAreaView>
    </View>
  );
}

// Simple SafeAreaView fallback if needed, but we already have react-native-safe-area-context
import { SafeAreaView } from 'react-native-safe-area-context';
