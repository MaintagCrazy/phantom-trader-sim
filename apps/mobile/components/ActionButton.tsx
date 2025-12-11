import { TouchableOpacity, Text, ActivityIndicator, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';

const styles = StyleSheet.create({
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  mediumButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  largeButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  fullWidth: {
    width: '100%',
  },
  flexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundedXl: {
    borderRadius: 12,
  },
  smallText: {
    fontSize: 12,
  },
  baseText: {
    fontSize: 14,
  },
  largeText: {
    fontSize: 16,
  },
  fontSemibold: {
    fontWeight: '600',
  },
  outlineStyle: {
    borderWidth: 2,
  },
});

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

  const getPaddingStyle = () => {
    switch (size) {
      case 'small':
        return styles.smallButton;
      case 'medium':
        return styles.mediumButton;
      case 'large':
        return styles.largeButton;
      default:
        return styles.mediumButton;
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'small':
        return styles.smallText;
      case 'medium':
        return styles.baseText;
      case 'large':
        return styles.largeText;
      default:
        return styles.baseText;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        getPaddingStyle(),
        styles.flexRow,
        styles.roundedXl,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' ? 2 : 0,
        },
        fullWidth && styles.fullWidth,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <View style={styles.flexRow}>
          {icon && (
            <Ionicons
              name={icon}
              size={size === 'small' ? 18 : size === 'large' ? 24 : 20}
              color={getTextColor()}
              style={{ marginRight: 8 }}
            />
          )}
          <Text
            style={[
              { color: getTextColor() },
              styles.fontSemibold,
              getTextSize(),
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default ActionButton;
