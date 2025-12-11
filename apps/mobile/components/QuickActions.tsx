import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.purpleDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    color: colors.white,
    fontSize: 12,
  },
});

interface QuickActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

function QuickAction({ icon, label, onPress }: QuickActionProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.actionButton}
      activeOpacity={0.7}
    >
      <View style={styles.actionCircle}>
        <Ionicons name={icon} size={24} color={colors.white} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export function QuickActions() {
  const router = useRouter();

  return (
    <View style={styles.container}>
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
