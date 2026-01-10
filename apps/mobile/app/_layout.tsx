// BMO Wallet Style Root Layout
// Pure Stack Navigation - No Tabs

import '../global.css';
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Platform, View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserStore } from '@/store/userStore';
import { usePortfolioStore } from '@/store/portfolioStore';
import { useCoinsStore } from '@/store/coinsStore';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Toast } from '@/components/Toast';
import Theme from '@/styles/theme';

// Fix for Expo Router's default gray backgrounds and iOS status bar
const fixWebBackgrounds = () => {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    // Fix viewport meta tag for iOS
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no');
    }

    // Add iOS status bar meta tags
    if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
      const appleMeta = document.createElement('meta');
      appleMeta.name = 'apple-mobile-web-app-capable';
      appleMeta.content = 'yes';
      document.head.appendChild(appleMeta);
    }
    if (!document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')) {
      const statusBarMeta = document.createElement('meta');
      statusBarMeta.name = 'apple-mobile-web-app-status-bar-style';
      statusBarMeta.content = 'black-translucent';
      document.head.appendChild(statusBarMeta);
    }

    // Set HTML and body background to purple gradient end color
    document.documentElement.style.backgroundColor = '#6155AC';
    document.body.style.backgroundColor = '#6155AC';

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

        // Fix white backgrounds
        if (computedBg === 'rgb(255, 255, 255)') {
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

// Hide the HTML splash screen (for web)
const hideSplashScreen = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    // @ts-ignore - window.hideSplash is defined in index.html
    window.hideSplash?.();
  }
};

export default function RootLayout() {
  const { userId, initUser, loadUser } = useUserStore();
  const { portfolio, fetchPortfolio } = usePortfolioStore();
  const { fetchCoins } = useCoinsStore();
  const [isInitializing, setIsInitializing] = useState(true);

  // Fix web backgrounds on mount
  useEffect(() => {
    const cleanup = fixWebBackgrounds();
    return cleanup;
  }, []);

  // Initialize app
  useEffect(() => {
    const init = async () => {
      setIsInitializing(true);
      try {
        if (!userId) {
          await initUser();
        } else {
          await loadUser();
        }
      } catch (error) {
        console.error('Init error:', error);
      } finally {
        setIsInitializing(false);
        // Hide HTML splash screen after init
        hideSplashScreen();
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

  // Show loading state while initializing or waiting for portfolio
  const isLoading = isInitializing || (userId && !portfolio);

  return (
    <View style={styles.safeAreaFill}>
      <LinearGradient
        colors={Theme.colors.primaryLinearGradient}
        style={styles.container}
      >
        <StatusBar style="light" translucent={true} />
        <GestureHandlerRootView style={styles.container}>
          <SafeAreaProvider>
            <ErrorBoundary>
              {/* Loading Overlay */}
              {isLoading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color={Theme.colors.white} />
                  <Text style={styles.loadingText}>Loading your portfolio...</Text>
                </View>
              )}
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
            </ErrorBoundary>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  safeAreaFill: {
    flex: 1,
    backgroundColor: '#6155AC', // Purple gradient end - fills iOS safe areas
  },
  container: {
    flex: 1,
    // Ensure gradient fills entire viewport on iOS Safari
    ...(Platform.OS === 'web' ? {
      minHeight: '100%',
    } : {}),
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(97, 85, 172, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    color: Theme.colors.white,
    fontSize: 16,
    marginTop: 16,
  },
});
