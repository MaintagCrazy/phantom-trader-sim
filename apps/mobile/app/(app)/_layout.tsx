// BMO Wallet Style App Layout
// Main app section with Stack navigation + Bottom Tab Bar

import { Stack, router } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Theme from '@/styles/theme';
import BottomTabBar from '@/components/BottomTabBar';

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
    <View style={styles.safeAreaFill}>
      <LinearGradient
        colors={Theme.colors.secondaryLinearGradient}
        style={styles.container}
      >
        <View style={styles.content}>
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

            {/* Token Detail Screen */}
            <Stack.Screen
              name="token/[id]"
              options={{
                headerShown: true,
                headerTransparent: true,
                headerTitle: '',
                headerLeft: () => <BackButton />,
              }}
            />

            {/* Camera/QR Scanner */}
            <Stack.Screen
              name="camera/index"
              options={{
                headerShown: false,
                presentation: 'fullScreenModal',
              }}
            />

            {/* Token Send */}
            <Stack.Screen
              name="token/send/[send]"
              options={{
                headerShown: true,
                headerTransparent: true,
                headerTitle: 'Send',
                headerTitleStyle: { color: Theme.colors.white },
                headerLeft: () => <BackButton />,
                presentation: 'modal',
              }}
            />

            {/* Send Confirmation */}
            <Stack.Screen
              name="token/send/send-confirmation"
              options={{
                headerShown: true,
                headerTransparent: true,
                headerTitle: 'Confirm',
                headerTitleStyle: { color: Theme.colors.white },
                headerLeft: () => <BackButton />,
                presentation: 'modal',
              }}
            />

            {/* Token Receive */}
            <Stack.Screen
              name="token/receive/[receive]"
              options={{
                headerShown: true,
                headerTransparent: true,
                headerTitle: '',
                headerLeft: () => <BackButton />,
                presentation: 'modal',
              }}
            />

            {/* Swap Modal */}
            <Stack.Screen
              name="swap"
              options={{
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
        <BottomTabBar />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  safeAreaFill: {
    flex: 1,
    backgroundColor: '#131314',
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  backButton: {
    padding: 10,
  },
});
