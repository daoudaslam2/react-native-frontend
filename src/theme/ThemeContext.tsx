import React from 'react';
import type { ColorSchemeName } from 'react-native';

import { darkColors, lightColors, type ThemeColors } from './colors';

export type ThemeMode = 'System' | 'Light' | 'Dark';
export type ResolvedThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  colors: ThemeColors;
  preference: ThemeMode;
  resolvedTheme: ResolvedThemeMode;
}

const ThemeContext = React.createContext<ThemeContextValue>({
  colors: lightColors,
  preference: 'System',
  resolvedTheme: 'light',
});

export function AppThemeProvider({
  children,
  preference,
  systemScheme,
}: {
  children: React.ReactNode;
  preference: ThemeMode;
  systemScheme: ColorSchemeName;
}): React.JSX.Element {
  const resolvedTheme = resolveThemeMode(preference, systemScheme);
  const value = React.useMemo<ThemeContextValue>(
    () => ({
      colors: resolvedTheme === 'dark' ? darkColors : lightColors,
      preference,
      resolvedTheme,
    }),
    [preference, resolvedTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useAppTheme(): ThemeContextValue {
  return React.useContext(ThemeContext);
}

export function useThemeColors(): ThemeColors {
  return useAppTheme().colors;
}

export function resolveThemeMode(
  preference: ThemeMode,
  systemScheme: ColorSchemeName,
): ResolvedThemeMode {
  if (preference === 'Dark') {
    return 'dark';
  }

  if (preference === 'Light') {
    return 'light';
  }

  return systemScheme === 'dark' ? 'dark' : 'light';
}

export function getThemeModeLabel(theme: ThemeMode): string {
  switch (theme) {
    case 'Dark':
      return 'Dark';
    case 'Light':
      return 'Light';
    case 'System':
      return 'System default';
  }
}
