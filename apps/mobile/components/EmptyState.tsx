import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ActionButton from './ActionButton';
import colors from '@/constants/colors';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionTitle?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionTitle,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <View
        className="w-20 h-20 rounded-full items-center justify-center mb-6"
        style={{ backgroundColor: colors.cardBg }}
      >
        <Ionicons name={icon} size={40} color={colors.gray} />
      </View>
      <Text className="text-white text-xl font-semibold mb-2 text-center">
        {title}
      </Text>
      <Text className="text-gray-400 text-center mb-6">
        {description}
      </Text>
      {actionTitle && onAction && (
        <ActionButton
          title={actionTitle}
          onPress={onAction}
          variant="primary"
        />
      )}
    </View>
  );
}

export default EmptyState;
