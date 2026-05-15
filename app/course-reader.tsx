import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Share2, Bookmark } from 'lucide-react-native';

import { TexRenderer } from '@/components/courses/TexRenderer';

// Mock data for testing
const MOCK_LESSON = `
  <h1>Dérivation et Étude de fonctions</h1>
  <p>Cette leçon présente les notions essentielles sur la dérivation des fonctions numériques d'une variable réelle.</p>
  
  <div class="callout">
    <div class="callout-title">Définition</div>
    Soit $f$ une fonction numérique définie sur un intervalle $I$ et $x_0 \in I$. On dit que $f$ est dérivable en $x_0$ si la limite suivante existe et est finie :
    $$ \lim_{h \to 0} \frac{f(x_0+h) - f(x_0)}{h} = f'(x_0) $$
  </div>

  <h2>1. Formules de dérivation</h2>
  <p>Voici les dérivées usuelles à connaître par cœur :</p>
  <ul>
    <li>$(x^n)' = n x^{n-1}$</li>
    <li>$(\sin x)' = \cos x$</li>
    <li>$(\cos x)' = -\sin x$</li>
    <li>$(\ln x)' = \frac{1}{x}$</li>
    <li>$(e^x)' = e^x$</li>
  </ul>

  <h2>2. Propriétés</h2>
  <p>Soient $u$ et $v$ deux fonctions dérivables sur $I$. Alors :</p>
  <p>
    $ (u+v)' = u' + v' $ <br/>
    $ (uv)' = u'v + uv' $ <br/>
    $ (\frac{u}{v})' = \frac{u'v - uv'}{v^2} $ (si $v(x) \neq 0$)
  </p>

  <div class="callout">
    <div class="callout-title">Remarque</div>
    La dérivée d'une fonction composée $(f \circ g)$ est donnée par :
    $$ (f(g(x)))' = f'(g(x)) \times g'(x) $$
  </div>
`;

export default function CourseReaderScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { title = 'Leçon', subject = 'Cours' } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Top Bar spacer */}
      <View style={{ height: insets.top, backgroundColor: '#3DBE45' }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <ChevronLeft color="#fff" size={24} />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.subjectText}>{subject}</Text>
          <Text style={styles.titleText} numberOfLines={1}>{title}</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionBtn}>
            <Bookmark color="#fff" size={20} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Share2 color="#fff" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <TexRenderer content={MOCK_LESSON} />
      </View>

      {/* Bottom Floating Action (Optional) */}
      <TouchableOpacity 
        style={[styles.quizFab, { bottom: insets.bottom + 20 }]}
        activeOpacity={0.9}
        onPress={() => router.push('/(tabs)/quiz')}
      >
        <Text style={styles.quizFabText}>🎯 Faire le Quiz</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 64,
    backgroundColor: '#3DBE45',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginHorizontal: 8,
  },
  subjectText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  titleText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: '#fff',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  quizFab: {
    position: 'absolute',
    right: 20,
    backgroundColor: '#1A2027',
    paddingHorizontal: 20,
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  quizFabText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: '#fff',
  },
});
