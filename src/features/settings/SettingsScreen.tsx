import React from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppText } from '../../components/AppText';
import { Icon, type IconName } from '../../components/Icon';
import { PrayerIcon, type PrayerIconName } from '../../components/PrayerIcon';
import { Screen } from '../../components/Screen';
import {
  getAsrMethodLabel,
  getCalculationMethodLabel,
  type PrayerLocation,
} from '../../constants/prayerSettings';
import type { RootStackParamList } from '../../navigation/types';
import {
  getThemeModeLabel,
  radius,
  spacing,
  useThemeColors,
} from '../../theme';
import { useAuthStore } from '../auth/authStore';
import {
  getBackupSyncFrequencyLabel,
  useBackupSyncStore,
} from './backupSyncStore';
import { useSettingsStore } from './settingsStore';

type SettingsNavigation = NativeStackNavigationProp<
  RootStackParamList,
  'Settings'
>;

export function SettingsScreen(): React.JSX.Element {
  const navigation = useNavigation<SettingsNavigation>();
  const settings = useSettingsStore();
  const colors = useThemeColors();
  const isLoggedIn = useAuthStore(
    state =>
      state.isAuthenticated &&
      state.onboardingCompleted &&
      state.authMode === 'localUser',
  );
  const autoSyncFrequency = useBackupSyncStore(
    state => state.autoSyncFrequency,
  );

  return (
    <Screen contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}>
          <Icon name="arrowLeft" size={28} color={colors.primary} />
        </Pressable>
        <AppText variant="headlineMobile" weight="700" align="center">
          Settings
        </AppText>
      </View>

      <SettingsSection title="General">
        <SettingsRow
          icon="palette"
          label="Theme"
          value={getThemeModeLabel(settings.theme)}
          onPress={() => navigation.navigate('ThemeSettings')}
        />
        <SettingsRow icon="language" label="Language" value={settings.language} />
        <ToggleRow
          icon="timer"
          label="24-Hour Time"
          value={settings.use24HourTime}
          onValueChange={settings.toggleUse24HourTime}
        />
      </SettingsSection>

      <SettingsSection title="Prayer Settings">
        <SettingsRow
          icon="timer"
          label="Calculation Method"
          value={getCalculationMethodLabel(settings.calculationMethod)}
          onPress={() => navigation.navigate('CalculationMethodSettings')}
        />
        <SettingsRow
          prayerIcon="asr"
          label="Asr Method"
          value={getAsrMethodLabel(settings.asrMethod)}
          onPress={() => navigation.navigate('AsrMethodSettings')}
        />
        <SettingsRow
          prayerIcon="isha"
          label="Isha End Time"
          value={getIshaDeadlineSettingLabel(
            settings.ishaDeadlineMinutes,
            settings.use24HourTime,
          )}
          onPress={() => navigation.navigate('IshaEndTimeSettings')}
        />
        <SettingsRow
          icon="location"
          label="Location"
          value={getLocationSettingLabel(settings.location)}
          onPress={() => navigation.navigate('LocationSetup')}
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
          value={
            isLoggedIn
              ? getBackupSyncFrequencyLabel(autoSyncFrequency)
              : 'Login required'
          }
          onPress={() => navigation.navigate('BackupSync')}
        />
      </SettingsSection>

      <SettingsSection title="App Info">
        <SettingsRow
          icon="shield"
          label="Privacy Policy"
          onPress={() => navigation.navigate('PrivacyPolicy')}
        />
        <SettingsRow
          icon="info"
          label="About Al-Salah"
          value="Version 0.2.0"
          onPress={() => navigation.navigate('About')}
        />
      </SettingsSection>
    </Screen>
  );
}

function getLocationSettingLabel(location: PrayerLocation | null): string {
  if (!location) {
    return 'Not set';
  }

  return location.source === 'device' ? 'Current location' : 'Manual location';
}

function getIshaDeadlineSettingLabel(
  minutes: number | null,
  use24HourTime: boolean,
): string {
  if (minutes === null) {
    return 'Islamic midnight';
  }

  return `Custom - ${formatClockMinutes(minutes, use24HourTime)}`;
}

function formatClockMinutes(minutes: number, use24HourTime: boolean): string {
  const dayMinutes = ((minutes % 1440) + 1440) % 1440;
  const hours = Math.floor(dayMinutes / 60);
  const minute = dayMinutes % 60;
  const paddedMinute = String(minute).padStart(2, '0');

  if (use24HourTime) {
    return `${String(hours).padStart(2, '0')}:${paddedMinute}`;
  }

  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;

  return `${hour12}:${paddedMinute} ${period}`;
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
  prayerIcon,
  label,
  value,
  interactive = true,
  onPress,
}: {
  icon?: IconName;
  prayerIcon?: PrayerIconName;
  label: string;
  value?: string;
  interactive?: boolean;
  onPress?: () => void;
}): React.JSX.Element {
  const colors = useThemeColors();

  return (
    <Pressable
      disabled={!interactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        interactive && pressed && { backgroundColor: colors.surfaceContainer },
      ]}>
      <View
        style={[
          styles.rowIcon,
          { backgroundColor: colors.surfaceHigh },
        ]}>
        {prayerIcon ? (
          <PrayerIcon
            name={prayerIcon}
            size={34}
            color={colors.onSurfaceVariant}
            backgroundColor={colors.transparent}
          />
        ) : icon ? (
          <Icon name={icon} color={colors.onSurfaceVariant} />
        ) : null}
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
  const colors = useThemeColors();

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.rowIcon,
          { backgroundColor: colors.surfaceHigh },
        ]}>
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
        trackColor={{
          false: colors.surfaceHighest,
          true: colors.secondaryContainer,
        }}
        thumbColor={value ? colors.primary : colors.outline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
  topBar: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
});
