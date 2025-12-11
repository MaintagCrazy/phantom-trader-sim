import { View, Text, Animated, StyleSheet } from 'react-native';
import { useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { create } from 'zustand';
import colors from '@/constants/colors';

// Toast store
interface ToastState {
  visible: boolean;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
  show: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
  hide: () => void;
}

export const useToast = create<ToastState>((set) => ({
  visible: false,
  type: 'info',
  title: '',
  message: undefined,
  show: (type, title, message) => {
    set({ visible: true, type, title, message });
    // Auto hide after 3 seconds
    setTimeout(() => set({ visible: false }), 3000);
  },
  hide: () => set({ visible: false }),
}));

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 48, left: 16, right: 16, zIndex: 50 },
  content: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, backgroundColor: colors.cardBg },
  iconContainer: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  textContainer: { flex: 1 },
  title: { color: colors.white, fontWeight: '600' },
  message: { color: colors.gray, fontSize: 14 },
});

// Toast component
export function Toast() {
  const { visible, type, title, message, hide } = useToast();
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : -100,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  }, [visible]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      default:
        return 'information-circle';
    }
  };

  const getColor = () => {
    switch (type) {
      case 'success':
        return colors.green;
      case 'error':
        return colors.red;
      default:
        return colors.purpleHeart;
    }
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: `${getColor()}20` }]}>
          <Ionicons name={getIcon()} size={24} color={getColor()} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          {message && <Text style={styles.message}>{message}</Text>}
        </View>
      </View>
    </Animated.View>
  );
}

export default Toast;
