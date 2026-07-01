import React from 'react';
import { useNavigation } from '@react-navigation/native';

import {
  ASR_METHOD_OPTIONS,
  type AsrMethodKey,
} from '../../constants/prayerSettings';
import {
  SettingsDetailScaffold,
  SettingsPrimaryButton,
} from './SettingsDetailScaffold';
import { SettingsOptionCard } from './SettingsOptionCard';
import { useSettingsStore } from './settingsStore';

export function AsrMethodSettingsScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const asrMethod = useSettingsStore(state => state.asrMethod);
  const setAsrMethod = useSettingsStore(state => state.setAsrMethod);
  const [selectedMethod, setSelectedMethod] =
    React.useState<AsrMethodKey>(asrMethod);

  const handleUpdate = () => {
    setAsrMethod(selectedMethod);
    navigation.goBack();
  };

  return (
    <SettingsDetailScaffold
      title="Asr Method"
      subtitle="Choose how Asr time is calculated for the prayer schedule."
      footer={
        <SettingsPrimaryButton
          label="Update Asr Method"
          onPress={handleUpdate}
        />
      }>
      {ASR_METHOD_OPTIONS.map(option => (
        <SettingsOptionCard
          key={option.key}
          label={option.label}
          description={option.description}
          selected={option.key === selectedMethod}
          onPress={() => setSelectedMethod(option.key)}
        />
      ))}
    </SettingsDetailScaffold>
  );
}
