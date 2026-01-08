// Simplified Dot Loader
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

interface PulseDotLoaderProps {
  size?: number;
  color?: string;
}

const PulseDotLoader: React.FC<PulseDotLoaderProps> = ({ size = 50, color = '#fff' }) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="small" color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PulseDotLoader;
