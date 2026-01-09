// BMO Wallet Style Header - Exact match to reference wallet
// Settings (left) | Account Name + Down Arrow (center) | QR Code (right)

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAccountsStore } from '@/store/accountsStore';
import Theme from '@/styles/theme';

// Custom SVG Icons (exact match to reference wallet)
import SettingsIcon from '@/assets/svg/SettingsIcon';
import QRCodeIcon from '@/assets/svg/QRCodeIcon';
import DownArrowIcon from '@/assets/svg/DownArrowIcon';
import LeftArrowIcon from '@/assets/svg/LeftArrowIcon';

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
      router.push('/(app)/camera');
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

  const accountName = activeAccount?.name || 'Main Account';

  return (
    <View style={styles.container}>
      {/* Left Section */}
      <View style={styles.leftContainer}>
        {showBack ? (
          <TouchableOpacity style={styles.iconButton} onPress={handleBack}>
            <LeftArrowIcon width={25} height={25} fill={Theme.colors.white} />
          </TouchableOpacity>
        ) : showSettings ? (
          <TouchableOpacity style={styles.iconButton} onPress={handleSettingsPress}>
            <SettingsIcon width={25} height={25} fill={Theme.colors.white} />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}
      </View>

      {/* Center Section - Account Name with Down Arrow */}
      <TouchableOpacity style={styles.centerContainer} onPress={handleAccountPress}>
        <Text style={styles.accountText}>{title || accountName}</Text>
        {!title && (
          <DownArrowIcon width={30} height={30} fill={Theme.colors.white} />
        )}
      </TouchableOpacity>

      {/* Right Section */}
      <View style={styles.rightContainer}>
        {showQR ? (
          <TouchableOpacity style={styles.iconButton} onPress={handleQRPress}>
            <QRCodeIcon width={25} height={25} fill={Theme.colors.white} />
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
});
