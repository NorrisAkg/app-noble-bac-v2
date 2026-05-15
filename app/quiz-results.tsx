import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { X } from 'lucide-react-native';

export default function QuizResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { score = '0', total = '0' } = useLocalSearchParams();
  const numericScore = Number(score);
  const numericTotal = Number(total);
  const percent = numericTotal > 0 ? Math.round((numericScore / numericTotal) * 100) : 0;

  const handleRetake = () => {
    // Go back to the subject selection screen
    router.replace('/(tabs)/quiz');
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 14 }]}>
        <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.7}>
          <X size={20} color="#fff" strokeWidth={2.4} />
        </TouchableOpacity>
        <Text style={styles.title}>Résultat du Quiz</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreNumber}>{numericScore}/{numericTotal}</Text>
          <Text style={styles.percentage}>{percent}%</Text>
        </View>
        <Text style={styles.feedback}> {percent >= 70 ? 'Très bien ! 🎉' : 'Tu peux faire mieux !'} </Text>
        
        <View style={styles.actions}>
          <TouchableOpacity style={styles.reviewBtn} onPress={() => router.push('/quiz-review')} activeOpacity={0.8}>
            <Text style={styles.reviewBtnText}>Voir les réponses</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.retakeBtn} onPress={handleRetake} activeOpacity={0.8}>
            <Text style={styles.retakeBtnText}>Recommencer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3DBE45', // same primary green for cohesion
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 16,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  scoreBox: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 30,
    paddingHorizontal: 40,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  scoreNumber: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 32,
    color: '#3DBE45',
  },
  percentage: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 20,
    color: '#1A2027',
    marginTop: 8,
  },
  feedback: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#fff',
    marginBottom: 30,
  },
  retakeBtn: {
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  retakeBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#3DBE45',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  reviewBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  reviewBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#fff',
  },
});
