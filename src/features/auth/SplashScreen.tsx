import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../../components/AppText';
import { LogoMark } from '../../components/LogoMark';
import type { RootStackParamList } from '../../navigation/types';
import { colors, spacing } from '../../theme';
import { useSettingsStore } from '../settings/settingsStore';
import { useAuthStore } from './authStore';

type SplashNavigation = NativeStackNavigationProp<
  RootStackParamList,
  'Splash'
>;

const SPLASH_DURATION_MS = 1_150;

export function SplashScreen(): React.JSX.Element {
  const navigation = useNavigation<SplashNavigation>();
  const insets = useSafeAreaInsets();
  const hasHydrated = useAuthStore(state => state.hasHydrated);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const onboardingCompleted = useAuthStore(
    state => state.onboardingCompleted,
  );
  const authPrayerLocation = useAuthStore(state => state.prayerLocation);
  const settingsLocation = useSettingsStore(state => state.location);
  const setPrayerLocation = useSettingsStore(state => state.setPrayerLocation);

  useEffect(() => {
    if (!hasHydrated) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      const resolvedLocation = settingsLocation ?? authPrayerLocation;

      if (!settingsLocation && authPrayerLocation) {
        setPrayerLocation(authPrayerLocation);
      }

      const routeName =
        isAuthenticated && onboardingCompleted && resolvedLocation
          ? 'MainTabs'
          : 'Login';

      navigation.reset({
        index: 0,
        routes: [{ name: routeName }],
      });
    }, SPLASH_DURATION_MS);

    return () => clearTimeout(timeoutId);
  }, [
    authPrayerLocation,
    hasHydrated,
    isAuthenticated,
    navigation,
    onboardingCompleted,
    setPrayerLocation,
    settingsLocation,
  ]);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + spacing.xl }]}>
      <View style={styles.center}>
        <LogoMark size={132} />
        <AppText variant="headlineMobile" color="primary" weight="700">
          Al-Salah
        </AppText>
      </View>
      <AppText
        variant="body"
        color="onSurfaceVariant"
        align="center"
        style={styles.tagline}>
        Your prayer companion, wherever you are.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.container,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  tagline: {
    maxWidth: 260,
  },
});
