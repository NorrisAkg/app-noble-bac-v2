import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Rect, Circle, Line, Path } from 'react-native-svg';
import { ChevronLeft } from 'lucide-react-native';

import { C } from '@/constants/theme';

const SUGGESTED = [
  'Explique-moi la mitose',
  'Corrige mon raisonnement de maths',
  'Résume le programme de philo',
  'Donne-moi un sujet d’entraînement',
];

const WELCOME_MESSAGE =
  'Bonjour ! Je suis Nobi, ton tuteur. Sur quoi veux-tu travailler aujourd’hui ?';

const STUB_REPLY =
  'Excellente question ! Voici comment je l’aborderais :\n\n1. Pose le contexte clairement\n2. Identifie les concepts-clés\n3. Construis ton raisonnement étape par étape\n\nVeux-tu que je détaille un point précis ?';

interface Message {
  role: 'ai' | 'user';
  text: string;
}

/**
 * Écran Tuteur IA Nobi — aligné `templates/screens-tutor.jsx`.
 *
 * **Limite backend** : pas d'endpoint `/tutor/chat` (cf. `docs/BACKEND_GAPS.md`
 * section 5.1). On utilise une réponse canned pour valider visuellement le
 * flow. À brancher sur le LLM dès que l'API expose l'endpoint.
 */
export default function TutorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: WELCOME_MESSAGE },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, typing]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((m) => [...m, { role: 'user', text: trimmed }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, { role: 'ai', text: STUB_REPLY }]);
    }, 1100);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={{ height: insets.top, backgroundColor: '#fff' }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ChevronLeft size={20} color={C.ink} strokeWidth={2.4} />
        </TouchableOpacity>
        <View style={styles.avatarWrap}>
          <LinearGradient
            colors={[C.green, C.greenDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <NobiAvatar />
          </LinearGradient>
          <View style={styles.statusDot} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerName}>Nobi · Tuteur IA</Text>
          <Text style={styles.headerStatus}>En ligne</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 0}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((m, i) => (
            <View
              key={i}
              style={[
                styles.bubbleWrap,
                m.role === 'user' ? styles.bubbleRowRight : styles.bubbleRowLeft,
              ]}
            >
              <View
                style={[
                  styles.bubble,
                  m.role === 'user' ? styles.bubbleUser : styles.bubbleAi,
                  m.role === 'user' ? styles.bubbleRadiusUser : styles.bubbleRadiusAi,
                ]}
              >
                <Text style={[styles.bubbleText, m.role === 'user' && styles.bubbleTextUser]}>
                  {m.text}
                </Text>
              </View>
            </View>
          ))}
          {typing && (
            <View style={[styles.bubbleWrap, styles.bubbleRowLeft]}>
              <View style={[styles.bubble, styles.bubbleAi, styles.bubbleRadiusAi, styles.typingBubble]}>
                <TypingDots />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Suggested chips (uniquement quand peu de messages) */}
        {messages.length <= 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestedContent}
          >
            {SUGGESTED.map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => send(s)}
                style={styles.suggestedChip}
                activeOpacity={0.7}
              >
                <Text style={styles.suggestedText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Input bar */}
        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Écris ta question…"
            placeholderTextColor={C.ink3}
            style={styles.input}
            onSubmitEditing={() => send(input)}
            returnKeyType="send"
          />
          <TouchableOpacity
            onPress={() => send(input)}
            disabled={!input.trim()}
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            activeOpacity={0.85}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M4 12 L20 4 L16 12 L20 20 Z" fill="#fff" />
            </Svg>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const NobiAvatar: React.FC = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Rect x={6} y={8} width={12} height={11} rx={3} fill="#fff" />
    <Circle cx={9.5} cy={13} r={1.4} fill={C.green} />
    <Circle cx={14.5} cy={13} r={1.4} fill={C.green} />
    <Line x1={12} y1={6} x2={12} y2={8} stroke="#fff" strokeWidth={1.6} strokeLinecap="round" />
    <Circle cx={12} cy={5} r={1.4} fill="#fff" />
  </Svg>
);

const TypingDots: React.FC = () => (
  <View style={{ flexDirection: 'row', gap: 4 }}>
    {[0, 1, 2].map((i) => (
      <View key={i} style={styles.typingDot} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#34D058',
    borderWidth: 2,
    borderColor: '#fff',
  },
  headerName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    color: C.ink,
  },
  headerStatus: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11.5,
    color: '#34A853',
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  bubbleWrap: {
    marginBottom: 10,
    flexDirection: 'row',
  },
  bubbleRowLeft: {
    justifyContent: 'flex-start',
  },
  bubbleRowRight: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '78%',
    paddingVertical: 11,
    paddingHorizontal: 14,
    shadowColor: C.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  bubbleAi: {
    backgroundColor: '#fff',
  },
  bubbleUser: {
    backgroundColor: C.green,
    shadowColor: C.green,
    shadowOpacity: 0.35,
    shadowRadius: 14,
  },
  bubbleRadiusAi: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderBottomLeftRadius: 6,
  },
  bubbleRadiusUser: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 6,
    borderBottomLeftRadius: 18,
  },
  bubbleText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13.5,
    lineHeight: 20,
    color: C.ink,
  },
  bubbleTextUser: {
    color: '#fff',
  },
  typingBubble: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.ink3,
  },
  suggestedContent: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 8,
  },
  suggestedChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 999,
    marginRight: 8,
  },
  suggestedText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12.5,
    color: C.ink,
  },
  inputBar: {
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: C.line,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    height: 44,
    paddingHorizontal: 16,
    backgroundColor: C.bg,
    borderRadius: 22,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: C.ink,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: C.line,
  },
});
