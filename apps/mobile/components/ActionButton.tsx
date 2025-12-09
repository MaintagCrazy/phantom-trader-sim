import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';

interface ActionButtonProps {
  title: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

export function ActionButton({
  title,
  onPress,
  icon,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
}: ActionButtonProps) {
  const getBackgroundColor = () => {
    if (disabled) return colors.shark;
    switch (variant) {
      case 'primary':
        return colors.purpleHeart;
      case 'secondary':
        return colors.cardBg;
      case 'outline':
        return 'transparent';
      default:
        return colors.purpleHeart;
    }
  };

  const getBorderColor = () => {
    if (variant === 'outline') return colors.purpleHeart;
    return 'transparent';
  };

  const getTextColor = () => {
    if (disabled) return colors.gray;
    return colors.white;
  };

  const getPadding = () => {
    switch (size) {
      case 'small':
        return 'py-2 px-4';
      case 'medium':
        return 'py-3 px-6';
      case 'large':
        return 'py-4 px-8';
      default:
        return 'py-3 px-6';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'small':
        return 'text-sm';
      case 'medium':
        return 'text-base';
      case 'large':
        return 'text-lg';
      default:
        return 'text-base';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={{
        backgroundColor: getBackgroundColor(),
        borderColor: getBorderColor(),
        borderWidth: variant === 'outline' ? 2 : 0,
      }}
      className={`
        flex-row items-center justify-center rounded-xl
        ${getPadding()}
        ${fullWidth ? 'w-full' : ''}
      `}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <View className="flex-row items-center">
          {icon && (
            <Ionicons
              name={icon}
              size={size === 'small' ? 18 : size === 'large' ? 24 : 20}
              color={getTextColor()}
              style={{ marginRight: 8 }}
            />
          )}
          <Text
            style={{ color: getTextColor() }}
            className={`font-semibold ${getTextSize()}`}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default ActionButton;
