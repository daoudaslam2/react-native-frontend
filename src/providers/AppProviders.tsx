import React, { useMemo } from 'react';
import { StatusBar, StyleSheet, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useBackupAutoSync } from '../features/settings/useBackupAutoSync';
import { useSettingsStore } from '../features/settings/settingsStore';
import { useMissedPrayerSync } from '../features/tracker/useMissedPrayerSync';
import { AppThemeProvider, resolveThemeMode, useAppTheme } from '../theme';

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({
  children,
}: AppProvidersProps): React.JSX.Element {
  const queryClient = useMemo(() => new QueryClient(), []);
  const theme = useSettingsStore(state => state.theme);
  const widgetTheme = useSettingsStore(state => state.widgetTheme);
  const useDarkWidgetTheme = useSettingsStore(
    state => state.useDarkWidgetTheme,
  );
  const setUseDarkWidgetTheme = useSettingsStore(
    state => state.setUseDarkWidgetTheme,
  );
  const systemScheme = useColorScheme();

  useMissedPrayerSync();
  useBackupAutoSync();

  React.useEffect(() => {
    const nextUseDarkWidgetTheme =
      resolveThemeMode(widgetTheme, systemScheme) === 'dark';

    if (nextUseDarkWidgetTheme !== useDarkWidgetTheme) {
      setUseDarkWidgetTheme(nextUseDarkWidgetTheme);
    }
  }, [
    setUseDarkWidgetTheme,
    systemScheme,
    useDarkWidgetTheme,
    widgetTheme,
  ]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AppThemeProvider preference={theme} systemScheme={systemScheme}>
            <ThemedStatusBar />
            {children}
          </AppThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function ThemedStatusBar(): React.JSX.Element {
  const { colors, resolvedTheme } = useAppTheme();

  return (
    <StatusBar
      barStyle={resolvedTheme === 'dark' ? 'light-content' : 'dark-content'}
      backgroundColor={colors.background}
    />
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
