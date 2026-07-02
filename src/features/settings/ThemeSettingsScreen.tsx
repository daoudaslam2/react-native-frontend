import React from 'react';

import { SettingsDetailScaffold } from './SettingsDetailScaffold';
import { SettingsOptionCard } from './SettingsOptionCard';
import { useSettingsStore } from './settingsStore';
import {
  getThemeModeLabel,
  useAppTheme,
  type ThemeMode,
} from '../../theme';

const themeOptions: ReadonlyArray<{
  value: ThemeMode;
  description: string;
}> = [
  {
    value: 'System',
    description: 'Follow your device appearance automatically.',
  },
  {
    value: 'Light',
    description: 'Use the current bright Al-Salah theme.',
  },
  {
    value: 'Dark',
    description: 'Use a darker theme for low-light reading.',
  },
];

export function ThemeSettingsScreen(): React.JSX.Element {
  const selectedTheme = useSettingsStore(state => state.theme);
  const setTheme = useSettingsStore(state => state.setTheme);
  const { resolvedTheme } = useAppTheme();

  return (
    <SettingsDetailScaffold
      title="Theme"
      subtitle={`Choose how Al-Salah looks. System default is currently ${resolvedTheme}.`}>
      {themeOptions.map(option => (
        <SettingsOptionCard
          key={option.value}
          label={getThemeModeLabel(option.value)}
          description={option.description}
          selected={selectedTheme === option.value}
          onPress={() => setTheme(option.value)}
        />
      ))}
    </SettingsDetailScaffold>
  );
}
