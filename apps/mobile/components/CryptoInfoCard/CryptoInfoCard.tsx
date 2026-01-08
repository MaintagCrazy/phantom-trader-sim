// BMO Wallet CryptoInfoCard Component
// Adapted from vinnyhoward/rn-crypto-wallet

import React, { memo } from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import Theme from '../../styles/theme';

interface CryptoInfoCardProps {
  title: string;
  caption: string;
  details: string;
  icon: React.ReactNode;
  onPress: () => void;
  hideBackground?: boolean;
}

const CryptoInfoCard: React.FC<CryptoInfoCardProps> = ({
  title,
  caption,
  details,
  icon,
  onPress,
  hideBackground = false,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.container,
        hideBackground && styles.transparent,
      ]}
      activeOpacity={0.7}
    >
      <View style={styles.chainContainer}>
        <View style={styles.circle}>{icon}</View>
        <View style={styles.textContainer}>
          <Text style={styles.titleText}>{title}</Text>
          <Text style={styles.captionText}>{caption}</Text>
        </View>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.titleText}>{details}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Theme.colors.lightDark,
    borderRadius: Theme.borderRadius.large,
    height: 75,
    padding: Theme.spacing.medium,
    paddingLeft: 20,
    paddingRight: 27.5,
    width: '100%',
    opacity: 0.95,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  chainContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circle: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
    borderRadius: 100,
    marginRight: 5,
  },
  textContainer: {
    flexDirection: 'column',
  },
  titleText: {
    fontWeight: '700',
    fontSize: Theme.fonts.sizes.large,
    color: Theme.colors.white,
  },
  captionText: {
    fontWeight: '700',
    fontSize: Theme.fonts.sizes.normal,
    color: Theme.colors.lightGrey,
  },
});

export default memo(CryptoInfoCard);
