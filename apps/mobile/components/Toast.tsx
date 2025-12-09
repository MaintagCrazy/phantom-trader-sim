import { View, Text, Animated } from 'react-native';
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
    <Animated.View
      className="absolute top-12 left-4 right-4 z-50"
      style={{ transform: [{ translateY }] }}
    >
      <View
        className="flex-row items-center p-4 rounded-xl"
        style={{ backgroundColor: colors.cardBg }}
      >
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: `${getColor()}20` }}
        >
          <Ionicons name={getIcon()} size={24} color={getColor()} />
        </View>
        <View className="flex-1">
          <Text className="text-white font-semibold">{title}</Text>
          {message && (
            <Text className="text-gray-400 text-sm">{message}</Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

export default Toast;
