import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { NavigationContainer, TabActions } from '@react-navigation/native';
import {
  type BottomTabBarProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../components/AppText';
import { Icon, type IconName } from '../components/Icon';
import { TopAppBar } from '../components/TopAppBar';
import { HomeScreen } from '../features/home/HomeScreen';
import { PrayerTimesScreen } from '../features/prayer-times/PrayerTimesScreen';
import { QazaScreen } from '../features/qaza/QazaScreen';
import { QiblaScreen } from '../features/qibla/QiblaScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';
import { PrayerTrackerScreen } from '../features/tracker/PrayerTrackerScreen';
import { colors, radius, spacing } from '../theme';
import type { MainTabParamList, TrackerStackParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const TrackerStack = createNativeStackNavigator<TrackerStackParamList>();

const tabConfig: Record<
  keyof MainTabParamList,
  {
    label: string;
    icon: IconName;
  }
> = {
  Home: { label: 'Home', icon: 'home' },
  PrayerTimes: { label: 'Prayers', icon: 'timer' },
  Qibla: { label: 'Qibla', icon: 'compass' },
  TrackerStack: { label: 'Tracker', icon: 'chart' },
  Settings: { label: 'Settings', icon: 'settings' },
};

export function AppNavigator(): React.JSX.Element {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          header: renderTopAppBar,
        }}
        tabBar={renderBottomNavigation}>
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="PrayerTimes" component={PrayerTimesScreen} />
        <Tab.Screen name="Qibla" component={QiblaScreen} />
        <Tab.Screen name="TrackerStack" component={TrackerStackNavigator} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

function renderTopAppBar(): React.JSX.Element {
  return <TopAppBar />;
}

function renderBottomNavigation(props: BottomTabBarProps): React.JSX.Element {
  return <BottomNavigation {...props} />;
}

function TrackerStackNavigator(): React.JSX.Element {
  return (
    <TrackerStack.Navigator screenOptions={{ headerShown: false }}>
      <TrackerStack.Screen name="PrayerTracker" component={PrayerTrackerScreen} />
      <TrackerStack.Screen name="Qaza" component={QazaScreen} />
    </TrackerStack.Navigator>
  );
}

function BottomNavigation({
  state,
  navigation,
}: BottomTabBarProps): React.JSX.Element {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {state.routes.map((route, index) => {
        const config = tabConfig[route.name as keyof MainTabParamList];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.dispatch({
              ...TabActions.jumpTo(route.name),
              target: state.key,
            });
          }
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={onPress}
            style={({ pressed }) => [
              styles.tabItem,
              isFocused && styles.tabItemActive,
              pressed && styles.tabPressed,
            ]}>
            <Icon
              name={config.icon}
              size={22}
              color={isFocused ? colors.onSecondaryContainer : colors.onSurfaceVariant}
              filled={isFocused}
            />
            <AppText
              variant="labelSmall"
              style={{
                color: isFocused
                  ? colors.onSecondaryContainer
                  : colors.onSurfaceVariant,
              }}>
              {config.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    minHeight: 80,
    paddingTop: 12,
    paddingHorizontal: spacing.sm,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.surfaceContainer,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 12,
  },
  tabItem: {
    minWidth: 62,
    minHeight: 52,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: spacing.sm,
  },
  tabItemActive: {
    backgroundColor: colors.secondaryContainer,
    paddingHorizontal: 18,
  },
  tabPressed: {
    opacity: 0.76,
    transform: [{ scale: 0.96 }],
  },
});
