// BMO Wallet PrimaryButton Component
// Adapted from vinnyhoward/rn-crypto-wallet

import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import Theme from '../../styles/theme';

interface ButtonProps {
  onPress: () => void;
  btnText: string;
  disabled?: boolean;
  icon: React.ReactNode;
}

const PrimaryButton: React.FC<ButtonProps> = ({
  onPress,
  btnText,
  disabled = false,
  icon,
}) => {
  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={disabled ? undefined : onPress}
      style={[styles.container, disabled && styles.disabled]}
      activeOpacity={0.7}
    >
      <View style={styles.circle}>{icon}</View>
      <View style={styles.textContainer}>
        <Text style={styles.buttonText}>{btnText}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.lightDark,
    borderRadius: Theme.borderRadius.large,
    height: 65,
    padding: Theme.spacing.medium,
    paddingLeft: 15,
  },
  disabled: {
    opacity: 0.5,
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
  buttonText: {
    fontWeight: '700',
    fontSize: Theme.fonts.sizes.large,
    color: Theme.colors.white,
  },
});

export default PrimaryButton;
