import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

export default function TabsLayout() {
  // Tab bar content height (icons + labels)
  const TAB_CONTENT_HEIGHT = 56;

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
            height: `calc(${TAB_CONTENT_HEIGHT}px + env(safe-area-inset-bottom, 0px))`,
            paddingTop: 10,
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            paddingHorizontal: 10,
            zIndex: 1000,
          },
          default: {
            backgroundColor: '#131314',
            borderTopColor: '#2C2D30',
            borderTopWidth: 0.5,
            height: TAB_CONTENT_HEIGHT,
            paddingTop: 10,
            paddingHorizontal: 10,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          },
        }),
        sceneContainerStyle: Platform.select({
          web: {
            backgroundColor: '#131314',
            paddingBottom: TAB_CONTENT_HEIGHT + 34, // Fixed for web
          },
          default: {
            backgroundColor: '#131314',
          },
        }),
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
