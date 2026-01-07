// BMO Wallet Style Root Layout
// Pure Stack Navigation - No Tabs

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useUserStore } from '@/store/userStore';
import { usePortfolioStore } from '@/store/portfolioStore';
import { useCoinsStore } from '@/store/coinsStore';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Toast } from '@/components/Toast';
import Theme from '@/styles/theme';

export default function RootLayout() {
  const { userId, initUser, loadUser } = useUserStore();
  const { fetchPortfolio } = usePortfolioStore();
  const { fetchCoins } = useCoinsStore();

  useEffect(() => {
    // Initialize user on app start
    const init = async () => {
      if (!userId) {
        await initUser();
      } else {
        await loadUser();
      }
    };
    init();
  }, []);

  useEffect(() => {
    // Load data when user is ready
    if (userId) {
      fetchPortfolio(userId);
      fetchCoins();
    }
  }, [userId]);

  // Refresh prices every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (userId) {
        fetchPortfolio(userId);
        fetchCoins();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [userId]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <View style={styles.container}>
            <StatusBar style="light" backgroundColor="transparent" translucent={true} />
            <Toast />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Theme.colors.dark },
                animation: 'slide_from_right',
              }}
            >
              {/* Main App Section */}
              <Stack.Screen name="(app)" options={{ headerShown: false }} />

              {/* Global Modals - accessible from anywhere */}
              <Stack.Screen
                name="deposit"
                options={{
                  presentation: 'modal',
                  animation: 'slide_from_bottom',
                }}
              />
              <Stack.Screen
                name="accounts/index"
                options={{
                  presentation: 'modal',
                  animation: 'slide_from_bottom',
                }}
              />
              <Stack.Screen
                name="confirm-trade"
                options={{
                  presentation: 'modal',
                  animation: 'slide_from_bottom',
                }}
              />
              <Stack.Screen
                name="trade-result"
                options={{
                  presentation: 'fullScreenModal',
                  animation: 'fade',
                  gestureEnabled: false,
                }}
              />
              <Stack.Screen
                name="token/[id]"
                options={{
                  presentation: 'card',
                  animation: 'slide_from_bottom',
                }}
              />
              <Stack.Screen
                name="margin/index"
                options={{
                  presentation: 'card',
                  animation: 'slide_from_right',
                }}
              />
              <Stack.Screen
                name="margin/new"
                options={{
                  presentation: 'modal',
                  animation: 'slide_from_bottom',
                }}
              />
              <Stack.Screen
                name="margin/position"
                options={{
                  presentation: 'card',
                  animation: 'slide_from_right',
                }}
              />
            </Stack>
          </View>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.dark,
  },
});
