import React from 'react';
import { useNavigation } from '@react-navigation/native';

import {
  CALCULATION_METHOD_OPTIONS,
  type CalculationMethodKey,
} from '../../constants/prayerSettings';
import {
  SettingsDetailScaffold,
  SettingsPrimaryButton,
} from './SettingsDetailScaffold';
import { SettingsOptionCard } from './SettingsOptionCard';
import { useSettingsStore } from './settingsStore';

export function CalculationMethodSettingsScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const calculationMethod = useSettingsStore(
    state => state.calculationMethod,
  );
  const setCalculationMethod = useSettingsStore(
    state => state.setCalculationMethod,
  );
  const [selectedMethod, setSelectedMethod] =
    React.useState<CalculationMethodKey>(calculationMethod);

  const handleUpdate = () => {
    setCalculationMethod(selectedMethod);
    navigation.goBack();
  };

  return (
    <SettingsDetailScaffold
      title="Calculation Method"
      subtitle="Choose the prayer time calculation convention used for your location."
      footer={
        <SettingsPrimaryButton
          label="Update Method"
          onPress={handleUpdate}
        />
      }>
      {CALCULATION_METHOD_OPTIONS.map(option => (
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
