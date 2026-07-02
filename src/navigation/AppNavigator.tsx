import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { NavigationContainer, TabActions } from '@react-navigation/native';
import type { Theme as NavigationTheme } from '@react-navigation/native';
import {
  type BottomTabBarProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../components/AppText';
import { Icon, type IconName } from '../components/Icon';
import { LocationSetupScreen } from '../features/auth/LocationSetupScreen';
import { LoginScreen } from '../features/auth/LoginScreen';
import { SignUpScreen } from '../features/auth/SignUpScreen';
import { SplashScreen } from '../features/auth/SplashScreen';
import { HomeScreen } from '../features/home/HomeScreen';
import { MoreScreen } from '../features/more/MoreScreen';
import { WidgetsScreen } from '../features/more/WidgetsScreen';
import { UpdateQazaCountsScreen } from '../features/qaza/UpdateQazaCountsScreen';
import { QazaScreen } from '../features/qaza/QazaScreen';
import { QiblaScreen } from '../features/qibla/QiblaScreen';
import { AboutScreen } from '../features/settings/AboutScreen';
import { AsrMethodSettingsScreen } from '../features/settings/AsrMethodSettingsScreen';
import { BackupSyncScreen } from '../features/settings/BackupSyncScreen';
import { CalculationMethodSettingsScreen } from '../features/settings/CalculationMethodSettingsScreen';
import { IshaEndTimeSettingsScreen } from '../features/settings/IshaEndTimeSettingsScreen';
import { PrivacyPolicyScreen } from '../features/settings/PrivacyPolicyScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';
import { ThemeSettingsScreen } from '../features/settings/ThemeSettingsScreen';
import { PrayerTrackerScreen } from '../features/tracker/PrayerTrackerScreen';
import { radius, spacing, useAppTheme } from '../theme';
import type {
  MainTabParamList,
  RootStackParamList,
} from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const tabConfig: Record<
  keyof MainTabParamList,
  {
    label: string;
    icon: IconName;
  }
> = {
  Home: { label: 'Home', icon: 'home' },
  Tracker: { label: 'Tracker', icon: 'chart' },
  Qaza: { label: 'Qaza', icon: 'namaz' },
  More: { label: 'More', icon: 'menu' },
};

export function AppNavigator(): React.JSX.Element {
  const { colors, resolvedTheme } = useAppTheme();
  const navigationTheme = React.useMemo<NavigationTheme>(
    () => ({
      dark: resolvedTheme === 'dark',
      colors: {
        primary: colors.primary,
        background: colors.background,
        card: colors.surfaceLowest,
        text: colors.onSurface,
        border: colors.surfaceVariant,
        notification: colors.primary,
      },
      fonts: {
        regular: { fontFamily: 'System', fontWeight: '400' },
        medium: { fontFamily: 'System', fontWeight: '500' },
        bold: { fontFamily: 'System', fontWeight: '700' },
        heavy: { fontFamily: 'System', fontWeight: '800' },
      },
    }),
    [colors, resolvedTheme],
  );

  return (
    <NavigationContainer theme={navigationTheme}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Splash" component={SplashScreen} />
        <RootStack.Screen name="Login" component={LoginScreen} />
        <RootStack.Screen name="SignUp" component={SignUpScreen} />
        <RootStack.Screen
          name="LocationSetup"
          component={LocationSetupScreen}
        />
        <RootStack.Screen name="MainTabs" component={MainTabNavigator} />
        <RootStack.Screen
          name="UpdateQazaCounts"
          component={UpdateQazaCountsScreen}
        />
        <RootStack.Screen name="Widgets" component={WidgetsScreen} />
        <RootStack.Screen name="Qibla" component={QiblaScreen} />
        <RootStack.Screen name="Settings" component={SettingsScreen} />
        <RootStack.Screen
          name="ThemeSettings"
          component={ThemeSettingsScreen}
        />
        <RootStack.Screen
          name="CalculationMethodSettings"
          component={CalculationMethodSettingsScreen}
        />
        <RootStack.Screen
          name="AsrMethodSettings"
          component={AsrMethodSettingsScreen}
        />
        <RootStack.Screen
          name="IshaEndTimeSettings"
          component={IshaEndTimeSettingsScreen}
        />
        <RootStack.Screen name="BackupSync" component={BackupSyncScreen} />
        <RootStack.Screen
          name="PrivacyPolicy"
          component={PrivacyPolicyScreen}
        />
        <RootStack.Screen name="About" component={AboutScreen} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

function MainTabNavigator(): React.JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
      }}
      tabBar={renderBottomNavigation}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Tracker" component={PrayerTrackerScreen} />
      <Tab.Screen name="Qaza" component={QazaScreen} />
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
}

function renderBottomNavigation(props: BottomTabBarProps): React.JSX.Element {
  return <BottomNavigation {...props} />;
}

function BottomNavigation({
  state,
  navigation,
}: BottomTabBarProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const colors = useAppTheme().colors;

  return (
    <View
      style={[
        styles.tabBar,
        {
          paddingBottom: Math.max(insets.bottom, 12),
          backgroundColor: colors.surfaceContainer,
        },
      ]}>
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
              isFocused && { backgroundColor: colors.secondaryContainer },
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
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 12,
  },
  tabItem: {
    flex: 1,
    minHeight: 52,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: spacing.xs,
  },
  tabPressed: {
    opacity: 0.76,
    transform: [{ scale: 0.96 }],
  },
});
