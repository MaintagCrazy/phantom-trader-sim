import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

export default function TabsLayout() {
  // Fixed height that accounts for iPhone home indicator
  // On web (iPhone Safari PWA), CSS env(safe-area-inset-bottom) is ~34px
  // We use a fixed 90px total height: 56px for content + 34px for home indicator
  const TAB_BAR_HEIGHT = 90;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: Platform.select({
          web: {
            position: 'fixed' as const,
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#131314',
            borderTopColor: '#2C2D30',
            borderTopWidth: 0.5,
            height: TAB_BAR_HEIGHT,
            paddingTop: 10,
            paddingBottom: 34,  // Fixed padding for home indicator
            paddingHorizontal: 10,
            zIndex: 1000,
          },
          default: {
            position: 'absolute' as const,
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#131314',
            borderTopColor: '#2C2D30',
            borderTopWidth: 0.5,
            height: TAB_BAR_HEIGHT,
            paddingTop: 10,
            paddingBottom: 34,
            paddingHorizontal: 10,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          },
        }),
        sceneContainerStyle: {
          backgroundColor: '#131314',
          paddingBottom: TAB_BAR_HEIGHT,
        },
        tabBarActiveTintColor: '#4E44CE',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="swap"
        options={{
          title: 'Swap',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="swap-horizontal" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
