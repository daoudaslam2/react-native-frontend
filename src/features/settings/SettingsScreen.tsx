import React from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { AppText } from '../../components/AppText';
import { Icon, type IconName } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import {
  ASR_METHOD_OPTIONS,
  CALCULATION_METHOD_OPTIONS,
  getAsrMethodLabel,
  getCalculationMethodLabel,
  type AsrMethodKey,
  type CalculationMethodKey,
  type PrayerSettingOption,
} from '../../constants/prayerSettings';
import { colors, radius, spacing } from '../../theme';
import { useSettingsStore } from './settingsStore';

export function SettingsScreen(): React.JSX.Element {
  const settings = useSettingsStore();

  return (
    <Screen contentContainerStyle={styles.content}>
      <AppText variant="headlineMobile">Settings</AppText>

      <SettingsSection title="General">
        <SettingsRow icon="palette" label="Theme" value={settings.theme} />
        <SettingsRow icon="language" label="Language" value={settings.language} />
        <ToggleRow
          icon="timer"
          label="24-Hour Time"
          value={settings.use24HourTime}
          onValueChange={settings.toggleUse24HourTime}
        />
      </SettingsSection>

      <SettingsSection title="Prayer Settings">
        <OptionRow
          icon="timer"
          label="Calculation Method"
          value={settings.calculationMethod}
          displayValue={getCalculationMethodLabel(settings.calculationMethod)}
          options={CALCULATION_METHOD_OPTIONS}
          onSelect={settings.setCalculationMethod}
        />
        <OptionRow
          icon="sun"
          label="Asr Method"
          value={settings.asrMethod}
          displayValue={getAsrMethodLabel(settings.asrMethod)}
          options={ASR_METHOD_OPTIONS}
          onSelect={settings.setAsrMethod}
        />
        <SettingsRow
          icon="location"
          label="Location"
          value={settings.locationMode}
          interactive={false}
        />
      </SettingsSection>

      <SettingsSection title="Notifications">
        <ToggleRow
          icon="bell"
          label="Adhan Notifications"
          value={settings.adhanNotifications}
          onValueChange={settings.toggleAdhanNotifications}
        />
        <ToggleRow
          icon="task"
          label="Qaza Reminders"
          value={settings.qazaReminders}
          onValueChange={settings.toggleQazaReminders}
        />
      </SettingsSection>

      <SettingsSection title="Data">
        <SettingsRow
          icon="cloud"
          label="Backup & Sync"
          value="Local only"
        />
      </SettingsSection>

      <SettingsSection title="App Info">
        <SettingsRow icon="info" label="About Al-Salah" value="Version 0.1.0" />
        <SettingsRow icon="shield" label="Privacy Policy" />
      </SettingsSection>
    </Screen>
  );
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <View style={styles.section}>
      <AppText variant="label" color="primary" transform="uppercase">
        {title}
      </AppText>
      <View style={styles.sectionRows}>{children}</View>
    </View>
  );
}

function SettingsRow({
  icon,
  label,
  value,
  interactive = true,
}: {
  icon: IconName;
  label: string;
  value?: string;
  interactive?: boolean;
}): React.JSX.Element {
  return (
    <Pressable
      disabled={!interactive}
      style={({ pressed }) => [
        styles.row,
        interactive && pressed && styles.pressed,
      ]}>
      <View style={styles.rowIcon}>
        <Icon name={icon} color={colors.onSurfaceVariant} />
      </View>
      <View style={styles.rowText}>
        <AppText variant="bodyLarge">{label}</AppText>
        {value ? (
          <AppText variant="body" color="onSurfaceVariant" numberOfLines={1}>
            {value}
          </AppText>
        ) : null}
      </View>
      {interactive ? (
        <Icon name="chevronRight" color={colors.onSurfaceVariant} />
      ) : null}
    </Pressable>
  );
}

function OptionRow<T extends CalculationMethodKey | AsrMethodKey>({
  icon,
  label,
  value,
  displayValue,
  options,
  onSelect,
}: {
  icon: IconName;
  label: string;
  value: T;
  displayValue: string;
  options: ReadonlyArray<PrayerSettingOption<T>>;
  onSelect: (value: T) => void;
}): React.JSX.Element {
  return (
    <View style={styles.optionRow}>
      <View style={styles.optionHeader}>
        <View style={styles.rowIcon}>
          <Icon name={icon} color={colors.onSurfaceVariant} />
        </View>
        <View style={styles.rowText}>
          <AppText variant="bodyLarge">{label}</AppText>
          <AppText variant="body" color="onSurfaceVariant" numberOfLines={1}>
            {displayValue}
          </AppText>
        </View>
      </View>
      <View style={styles.options}>
        {options.map(option => {
          const isSelected = option.key === value;

          return (
            <Pressable
              key={option.key}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              onPress={() => onSelect(option.key)}
              style={({ pressed }) => [
                styles.optionPill,
                isSelected && styles.optionPillSelected,
                pressed && styles.pressed,
              ]}>
              <AppText
                variant="labelSmall"
                color={isSelected ? 'onPrimary' : 'onSurfaceVariant'}
                weight="700">
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ToggleRow({
  icon,
  label,
  value,
  onValueChange,
}: {
  icon: IconName;
  label: string;
  value: boolean;
  onValueChange: () => void;
}): React.JSX.Element {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Icon name={icon} color={colors.onSurfaceVariant} />
      </View>
      <View style={styles.rowText}>
        <AppText variant="bodyLarge">{label}</AppText>
        <AppText variant="body" color="onSurfaceVariant">
          {value ? 'Enabled' : 'Disabled'}
        </AppText>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.surfaceHighest, true: colors.secondaryContainer }}
        thumbColor={value ? colors.primary : colors.outline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
  section: {
    gap: spacing.sm,
  },
  sectionRows: {
    gap: spacing.sm,
  },
  row: {
    minHeight: 64,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceHigh,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  optionRow: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  optionHeader: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingLeft: 52,
  },
  optionPill: {
    minHeight: 34,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.outlineVariant,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceLowest,
  },
  optionPillSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  pressed: {
    backgroundColor: colors.surfaceContainer,
  },
});
