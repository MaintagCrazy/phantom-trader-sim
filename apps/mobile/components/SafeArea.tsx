import { Platform, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';

interface SafeAreaProps {
  children: React.ReactNode;
  edges?: Edge[];
  style?: ViewStyle;
}

/**
 * Platform-aware SafeAreaView wrapper
 * On web, we don't use safe area insets since the browser handles viewport
 */
export function SafeArea({ children, edges = ['top'], style }: SafeAreaProps) {
  // On web, don't apply safe area edges (causes visual artifacts)
  const resolvedEdges = Platform.OS === 'web' ? [] : edges;

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
