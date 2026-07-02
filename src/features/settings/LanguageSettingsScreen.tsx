import React from 'react';

import { SettingsDetailScaffold } from './SettingsDetailScaffold';
import { SettingsOptionCard } from './SettingsOptionCard';
import {
  type Language,
  useSettingsStore,
} from './settingsStore';

const languageOptions: ReadonlyArray<{
  value: Language;
  description: string;
}> = [
  {
    value: 'English',
    description: 'Use English throughout the app.',
  },
];

export function LanguageSettingsScreen(): React.JSX.Element {
  const selectedLanguage = useSettingsStore(state => state.language);
  const setLanguage = useSettingsStore(state => state.setLanguage);

  return (
    <SettingsDetailScaffold
      title="Language"
      subtitle="Choose the app language. More languages will be added later.">
      {languageOptions.map(option => (
        <SettingsOptionCard
          key={option.value}
          label={option.value}
          description={option.description}
          selected={selectedLanguage === option.value}
          onPress={() => setLanguage(option.value)}
        />
      ))}
    </SettingsDetailScaffold>
  );
}
