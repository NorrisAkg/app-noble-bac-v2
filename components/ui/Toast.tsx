import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react-native';

export type ToastTone = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  visible: boolean;
  message: string;
  tone?: ToastTone;
  /** Duree d'affichage en ms (defaut 2500). */
  durationMs?: number;
  onHide: () => void;
}

const TONE_CONFIG: Record<ToastTone, { color: string; bg: string; icon: typeof CheckCircle2 }> = {
  success: { color: '#3DBE45', bg: '#EAF7EB', icon: CheckCircle2 },
  error: { color: '#E14B36', bg: '#FCEAE6', icon: XCircle },
  warning: { color: '#FFB800', bg: '#FFF6E0', icon: AlertTriangle },
  info: { color: '#3D7BBE', bg: '#E8F1FB', icon: Info },
};

/**
 * Toast in-app reutilisable. A monter au plus haut niveau d'un ecran
 * (typiquement controle via un useState `toast`). Utilise Animated pour
 * fade-in + fade-out automatique apres `durationMs`.
 *
 * Exemple :
 *   const [toast, setToast] = useState({ visible: false, ... });
 *   <Toast {...toast} onHide={() => setToast(prev => ({ ...prev, visible: false }))} />
 *
 * Vise a remplacer les Alert.alert("Succes", "...") plus intrusifs.
 */
export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  tone = 'info',
  durationMs = 2500,
  onHide,
}) => {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const config = TONE_CONFIG[tone];
  const Icon = config.icon;

  useEffect(() => {
    if (!visible) {
      opacity.setValue(0);
      return;
    }
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(
        ({ finished }) => {
          if (finished) onHide();
        },
      );
    }, durationMs);
    return () => clearTimeout(timer);
  }, [visible, durationMs, onHide, opacity]);

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        { top: insets.top + 12, backgroundColor: config.bg, opacity },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: config.color + '20' }]}>
        <Icon size={18} color={config.color} strokeWidth={2.4} />
      </View>
      <Text style={[styles.message, { color: config.color }]} numberOfLines={3}>
        {message}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#1A2027',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 1000,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    flex: 1,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
  },
});
