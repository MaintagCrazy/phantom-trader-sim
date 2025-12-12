import { Platform, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';

interface SafeAreaProps {
  children: React.ReactNode;
  edges?: Edge[];
  style?: ViewStyle;
}

/**
 * Platform-aware SafeAreaView wrapper
 * Safe areas are needed for iOS PWA to handle notch and home indicator
 */
export function SafeArea({ children, edges = ['top'], style }: SafeAreaProps) {
  // Always use edges - iOS PWA needs them for proper safe area handling
  const resolvedEdges = edges;

  return (
    <SafeAreaView edges={resolvedEdges} style={[styles.container, style]}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131314',
  },
});

export default SafeArea;
