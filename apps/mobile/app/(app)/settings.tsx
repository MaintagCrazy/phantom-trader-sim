// BMO Wallet Style Settings Screen
// Modal presentation

import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Theme from '@/styles/theme';
import { useUserStore } from '@/store/userStore';

interface SettingsItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showArrow?: boolean;
  color?: string;
}

const SettingsItem = ({ icon, title, subtitle, onPress, showArrow = true, color }: SettingsItemProps) => (
  <TouchableOpacity style={styles.settingsItem} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.iconContainer, { backgroundColor: `${color || Theme.colors.primary}20` }]}>
      <Ionicons name={icon} size={22} color={color || Theme.colors.primary} />
    </View>
    <View style={styles.itemContent}>
      <Text style={styles.itemTitle}>{title}</Text>
      {subtitle && <Text style={styles.itemSubtitle}>{subtitle}</Text>}
    </View>
    {showArrow && (
      <Ionicons name="chevron-forward" size={20} color={Theme.colors.grey} />
    )}
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const { userId } = useUserStore();
  const insets = useSafeAreaInsets();

  const handleSecurityPress = () => {
    Alert.alert('Security', 'Security settings coming soon');
  };

  const handleNotificationsPress = () => {
    Alert.alert('Notifications', 'Notification settings coming soon');
  };

  const handleCurrencyPress = () => {
    Alert.alert('Currency', 'Currency settings coming soon');
  };

  const handleHelpPress = () => {
    Alert.alert('Help & Support', 'Help center coming soon');
  };

  const handleAboutPress = () => {
    Alert.alert('About', 'Phantom Wallet v1.0.0\n\nYour crypto trading platform.');
  };

  const handleResetPress = () => {
    Alert.alert(
      'Reset App',
      'This will reset all your data and start fresh. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => console.log('Reset pressed') },
      ]
    );
  };

  return (
    <View style={styles.safeAreaBackground}>
      <LinearGradient colors={Theme.colors.primaryLinearGradient} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={Theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.sectionCard}>
            <SettingsItem
              icon="person-outline"
              title="Manage Wallets"
              subtitle="View and manage your accounts"
              onPress={() => router.push('/accounts')}
            />
            <SettingsItem
              icon="shield-checkmark-outline"
              title="Security"
              subtitle="Biometrics, passcode"
              onPress={handleSecurityPress}
            />
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.sectionCard}>
            <SettingsItem
              icon="notifications-outline"
              title="Notifications"
              subtitle="Push, email alerts"
              onPress={handleNotificationsPress}
            />
            <SettingsItem
              icon="cash-outline"
              title="Currency"
              subtitle="USD"
              onPress={handleCurrencyPress}
            />
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.sectionCard}>
            <SettingsItem
              icon="help-circle-outline"
              title="Help & Support"
              onPress={handleHelpPress}
            />
            <SettingsItem
              icon="information-circle-outline"
              title="About"
              subtitle="Version 1.0.0"
              onPress={handleAboutPress}
            />
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <View style={styles.sectionCard}>
            <SettingsItem
              icon="refresh-outline"
              title="Reset App"
              subtitle="Clear all data and start over"
              onPress={handleResetPress}
              color={Theme.colors.accent}
              showArrow={false}
            />
          </View>
        </View>

        {/* User ID for debugging */}
        <View style={styles.debugSection}>
          <Text style={styles.debugText}>User ID: {userId?.slice(0, 8)}...</Text>
        </View>
      </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  safeAreaBackground: {
    flex: 1,
    backgroundColor: '#6155AC', // Match gradient end color for bottom safe area
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.medium,
    paddingTop: 60,
    paddingBottom: Theme.spacing.medium,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    color: Theme.colors.white,
    fontSize: Theme.fonts.sizes.header,
    fontWeight: '700',
  },
  placeholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: Theme.spacing.medium,
  },
  section: {
    marginBottom: Theme.spacing.large,
  },
  sectionTitle: {
    color: Theme.colors.lightGrey,
    fontSize: Theme.fonts.sizes.normal,
    fontWeight: '600',
    marginBottom: Theme.spacing.small,
    marginLeft: Theme.spacing.small,
  },
  sectionCard: {
    backgroundColor: `${Theme.colors.dark}90`,
    borderRadius: Theme.borderRadius.large,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.medium,
    paddingHorizontal: Theme.spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.lightDark,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: Theme.borderRadius.default,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.medium,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    color: Theme.colors.white,
    fontSize: Theme.fonts.sizes.large,
    fontWeight: '500',
  },
  itemSubtitle: {
    color: Theme.colors.lightGrey,
    fontSize: Theme.fonts.sizes.normal,
    marginTop: 2,
  },
  debugSection: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.large,
  },
  debugText: {
    color: Theme.colors.grey,
    fontSize: Theme.fonts.sizes.small,
  },
});
