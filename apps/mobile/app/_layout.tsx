// BMO Wallet Style Root Layout
// Pure Stack Navigation - No Tabs

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserStore } from '@/store/userStore';
import { usePortfolioStore } from '@/store/portfolioStore';
import { useCoinsStore } from '@/store/coinsStore';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Toast } from '@/components/Toast';
import Theme from '@/styles/theme';

// Fix for Expo Router's default gray backgrounds and dark SafeAreaView on web
const fixWebBackgrounds = () => {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const fixBackgrounds = () => {
      document.querySelectorAll('*').forEach((el: Element) => {
        const htmlEl = el as HTMLElement;
        const computedBg = window.getComputedStyle(htmlEl).backgroundColor;

        // Fix light gray backgrounds (Expo Router default)
        if (computedBg === 'rgb(242, 242, 242)') {
          htmlEl.style.backgroundColor = 'transparent';
        }

        // Fix dark SafeAreaView background (rgb(28, 28, 30))
        if (computedBg === 'rgb(28, 28, 30)') {
          htmlEl.style.backgroundColor = 'transparent';
        }
      });
    };

    // Fix immediately and set up observer for dynamic changes
    fixBackgrounds();

    const observer = new MutationObserver(fixBackgrounds);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    return () => observer.disconnect();
  }
  return undefined;
};

export default function RootLayout() {
  const { userId, initUser, loadUser } = useUserStore();
  const { fetchPortfolio } = usePortfolioStore();
  const { fetchCoins } = useCoinsStore();

  // Fix web backgrounds on mount
  useEffect(() => {
    const cleanup = fixWebBackgrounds();
    return cleanup;
  }, []);

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
          <LinearGradient
            colors={Theme.colors.primaryLinearGradient}
            style={styles.container}
          >
            <StatusBar style="light" backgroundColor="transparent" translucent={true} />
            <Toast />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: 'transparent' },
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
          </LinearGradient>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
