import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useUserStore } from '@/store/userStore';
import { usePortfolioStore } from '@/store/portfolioStore';
import { useCoinsStore } from '@/store/coinsStore';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Toast } from '@/components/Toast';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131314',
  },
});

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
    <SafeAreaProvider>
      <ErrorBoundary>
        <View style={styles.container}>
          <StatusBar style="light" />
          <Toast />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#131314' },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="token/[id]"
              options={{
                presentation: 'card',
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen
              name="deposit"
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
          </Stack>
        </View>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
