import React, { useMemo } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useBackupAutoSync } from '../features/settings/useBackupAutoSync';
import { useMissedPrayerSync } from '../features/tracker/useMissedPrayerSync';
import { colors } from '../theme';

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({
  children,
}: AppProvidersProps): React.JSX.Element {
  const queryClient = useMemo(() => new QueryClient(), []);
  useMissedPrayerSync();
  useBackupAutoSync();

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar
            barStyle="dark-content"
            backgroundColor={colors.background}
          />
          {children}
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
