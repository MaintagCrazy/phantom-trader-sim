// BMO Wallet Button Component
// Adapted from vinnyhoward/rn-crypto-wallet

import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Theme from '../../styles/theme';
import PulseDotLoader from '../Loader/DotLoader';

interface ButtonProps {
  icon?: React.ReactNode;
  onPress: () => void;
  title: string;
  disabled?: boolean;
  color?: string;
  backgroundColor?: string;
  loading?: boolean;
  linearGradient?: readonly [string, string, ...string[]];
}

const Button: React.FC<ButtonProps> = ({
  icon,
  onPress,
  title,
  color,
  backgroundColor,
  disabled = false,
  loading = false,
  linearGradient,
}) => {
  const handlePress = () => {
    if (!disabled && !loading) {
      onPress();
    }
  };

  const content = (
    <>
      {!loading ? (
        <View style={styles.row}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[styles.buttonText, color && { color }]}>{title}</Text>
        </View>
      ) : (
        <PulseDotLoader size={50} color="#fff" />
      )}
    </>
  );

  if (linearGradient) {
    return (
      <TouchableOpacity
        disabled={disabled || loading}
        onPress={handlePress}
        style={[styles.container, disabled && styles.disabled]}
        activeOpacity={0.8}
      >
        <LinearGradient
          start={{ x: 0.5, y: 0.2 }}
          colors={linearGradient}
          style={styles.gradient}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      disabled={disabled || loading}
      onPress={handlePress}
      style={[
        styles.container,
        styles.solidButton,
        backgroundColor && { backgroundColor },
        disabled && styles.disabled,
      ]}
      activeOpacity={0.8}
    >
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: Theme.borderRadius.large,
    overflow: 'hidden',
  },
  solidButton: {
    backgroundColor: Theme.colors.primary,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Theme.borderRadius.large,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: Theme.spacing.small,
  },
  buttonText: {
    fontWeight: '700',
    fontSize: Theme.fonts.sizes.header,
    color: Theme.colors.white,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default Button;
