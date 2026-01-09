// BMO Wallet Style Header
// Settings (left) | Account Name (center) | QR Code (right)

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAccountsStore } from '@/store/accountsStore';
import Theme from '@/styles/theme';

interface BMOHeaderProps {
  showSettings?: boolean;
  showQR?: boolean;
  showBack?: boolean;
  title?: string;
  onSettingsPress?: () => void;
  onQRPress?: () => void;
}

export default function BMOHeader({
  showSettings = true,
  showQR = true,
  showBack = false,
  title,
  onSettingsPress,
  onQRPress,
}: BMOHeaderProps) {
  const { activeAccount } = useAccountsStore();

  const handleSettingsPress = () => {
    if (onSettingsPress) {
      onSettingsPress();
    } else {
      router.push('/(app)/settings');
    }
  };

  const handleQRPress = () => {
    if (onQRPress) {
      onQRPress();
    } else {
      // QR scanner functionality
      console.log('QR pressed');
    }
  };

  const handleAccountPress = () => {
    router.push('/accounts');
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    }
  };

  const accountName = activeAccount?.name || 'Trade Demo';

  return (
    <View style={styles.container}>
      {/* Left Section */}
      <View style={styles.leftContainer}>
        {showBack ? (
          <TouchableOpacity style={styles.iconButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={25} color={Theme.colors.white} />
          </TouchableOpacity>
        ) : showSettings ? (
          <TouchableOpacity style={styles.iconButton} onPress={handleSettingsPress}>
            <Ionicons name="settings-outline" size={25} color={Theme.colors.white} />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}
      </View>

      {/* Center Section - Account Name */}
      <TouchableOpacity style={styles.centerContainer} onPress={handleAccountPress}>
        <Text style={styles.accountText}>{title || accountName}</Text>
        {!title && (
          <Ionicons name="chevron-down" size={20} color={Theme.colors.white} style={styles.chevron} />
        )}
      </TouchableOpacity>

      {/* Right Section */}
      <View style={styles.rightContainer}>
        {showQR ? (
          <TouchableOpacity style={styles.iconButton} onPress={handleQRPress}>
            <Ionicons name="qr-code-outline" size={25} color={Theme.colors.white} />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.medium,
    paddingTop: Theme.spacing.small,
    paddingBottom: Theme.spacing.small,
  },
  leftContainer: {
    width: 50,
    alignItems: 'flex-start',
  },
  centerContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightContainer: {
    width: 50,
    alignItems: 'flex-end',
  },
  iconButton: {
    padding: 10,
  },
  iconPlaceholder: {
    width: 45,
    height: 45,
  },
  accountText: {
    fontWeight: '700',
    fontSize: Theme.fonts.sizes.header,
    color: Theme.colors.white,
  },
  chevron: {
    marginLeft: 4,
  },
});
