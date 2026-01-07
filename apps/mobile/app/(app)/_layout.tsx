// BMO Wallet Style App Layout
// Main app section with Stack navigation

import { Stack, router } from 'expo-router';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Theme from '@/styles/theme';

export default function AppLayout() {
  const BackButton = () => (
    <TouchableOpacity
      style={styles.backButton}
      onPress={() => router.back()}
    >
      <Ionicons name="arrow-back" size={25} color={Theme.colors.primary} />
    </TouchableOpacity>
  );

  const CloseButton = () => (
    <TouchableOpacity
      style={styles.backButton}
      onPress={() => router.back()}
    >
      <Ionicons name="close" size={25} color={Theme.colors.primary} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
          headerTransparent: true,
          gestureEnabled: true,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      >
        {/* Home Screen - No header */}
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />

        {/* Swap Modal */}
        <Stack.Screen
          name="swap"
          options={{
            presentation: 'modal',
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
        />

        {/* Activity Screen */}
        <Stack.Screen
          name="activity"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />

        {/* Discover Screen */}
        <Stack.Screen
          name="discover"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />

        {/* Settings Modal */}
        <Stack.Screen
          name="settings"
          options={{
            presentation: 'modal',
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
        />

        {/* Send Options Modal */}
        <Stack.Screen
          name="send-options"
          options={{
            presentation: 'modal',
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
        />

        {/* Receive Options Modal */}
        <Stack.Screen
          name="receive-options"
          options={{
            presentation: 'modal',
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.dark,
  },
  backButton: {
    padding: 10,
  },
});
