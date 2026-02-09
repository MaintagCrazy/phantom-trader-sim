import React, { memo } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import Theme from '@/styles/theme';

const tabs = [
  { name: 'Home', icon: 'wallet' as const, iconOutline: 'wallet-outline' as const, route: '/(app)' },
  { name: 'Discover', icon: 'compass' as const, iconOutline: 'compass-outline' as const, route: '/(app)/discover' },
  { name: 'Swap', icon: 'swap-horizontal' as const, iconOutline: 'swap-horizontal-outline' as const, route: '/(app)/swap' },
  { name: 'Activity', icon: 'time' as const, iconOutline: 'time-outline' as const, route: '/(app)/activity' },
];

// Screens where the tab bar should be visible
const TAB_VISIBLE_PATHS = ['/', '/discover', '/activity'];
// Screens where tab bar should be hidden (modals, detail screens)
const isTabScreen = (pathname: string) => {
  const normalized = pathname.replace('/(app)', '').replace(/\/$/, '') || '/';
  return TAB_VISIBLE_PATHS.includes(normalized);
};

const BottomTabBar = memo(() => {
  const pathname = usePathname();
  const normalizedPath = pathname.replace('/(app)', '').replace(/\/$/, '') || '/';

  if (!isTabScreen(pathname)) return null;

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive =
            (tab.route === '/(app)' && normalizedPath === '/') ||
            normalizedPath === tab.route.replace('/(app)', '');

          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tab}
              onPress={() => {
                if (!isActive) {
                  if (tab.route === '/(app)') {
                    router.replace('/');
                  } else {
                    router.push(tab.route as any);
                  }
                }
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isActive ? tab.icon : tab.iconOutline}
                size={24}
                color={isActive ? Theme.colors.primary : Theme.colors.lightGrey}
              />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.dark,
    borderTopWidth: 0.5,
    borderTopColor: Theme.colors.lightDark,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    ...(Platform.OS === 'web' ? {
      paddingBottom: 8,
    } : {}),
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 10,
    color: Theme.colors.lightGrey,
    marginTop: 4,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: Theme.colors.primary,
  },
});

export default BottomTabBar;
