import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';

interface QuickActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

function QuickAction({ icon, label, onPress }: QuickActionProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="items-center"
      activeOpacity={0.7}
    >
      <View
        className="w-14 h-14 rounded-full items-center justify-center mb-2"
        style={{ backgroundColor: colors.purpleDark }}
      >
        <Ionicons name={icon} size={24} color={colors.white} />
      </View>
      <Text className="text-white text-sm">{label}</Text>
    </TouchableOpacity>
  );
}

export function QuickActions() {
  const router = useRouter();

  return (
    <View className="flex-row justify-around py-6 px-4">
      <QuickAction
        icon="add"
        label="Deposit"
        onPress={() => router.push('/deposit')}
      />
      <QuickAction
        icon="arrow-up"
        label="Send"
        onPress={() => {}} // Not implemented in paper trading
      />
      <QuickAction
        icon="swap-horizontal"
        label="Swap"
        onPress={() => router.push('/(tabs)/swap')}
      />
      <QuickAction
        icon="cart"
        label="Buy"
        onPress={() => router.push('/(tabs)/search')}
      />
    </View>
  );
}

export default QuickActions;
