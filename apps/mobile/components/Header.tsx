import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';

interface HeaderProps {
  title?: string;
  showSettings?: boolean;
  onSettingsPress?: () => void;
}

export function Header({ title = 'Trade Demo', showSettings = true, onSettingsPress }: HeaderProps) {
  return (
    <View
      className="flex-row items-center justify-between px-4 py-3"
      style={{ backgroundColor: colors.purpleDark }}
    >
      <View className="flex-row items-center">
        <View className="w-8 h-8 rounded-full bg-purple-heart items-center justify-center mr-2">
          <Text className="text-white font-bold text-lg">T</Text>
        </View>
        <Text className="text-white text-lg font-semibold">{title}</Text>
      </View>

      {showSettings && (
        <TouchableOpacity
          onPress={onSettingsPress}
          className="w-10 h-10 items-center justify-center"
        >
          <Ionicons name="settings-outline" size={24} color={colors.white} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export default Header;
