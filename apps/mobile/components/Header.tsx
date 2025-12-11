import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.purpleDark,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.purpleHeart,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  logoText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 18,
  },
  title: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  settingsButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

interface HeaderProps {
  title?: string;
  showSettings?: boolean;
  onSettingsPress?: () => void;
}

export function Header({ title = 'Trade Demo', showSettings = true, onSettingsPress }: HeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.titleSection}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>T</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>

      {showSettings && (
        <TouchableOpacity
          onPress={onSettingsPress}
          style={styles.settingsButton}
        >
          <Ionicons name="settings-outline" size={24} color={colors.white} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export default Header;
