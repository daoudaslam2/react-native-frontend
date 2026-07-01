import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppText } from '../../components/AppText';
import { Icon } from '../../components/Icon';
import type { RootStackParamList } from '../../navigation/types';
import { colors, radius, spacing } from '../../theme';
import { useAuthStore } from '../auth/authStore';
import {
  BACKUP_SYNC_OPTIONS,
  type BackupSyncOption,
  type BackupSyncFrequency,
  useBackupSyncStore,
} from './backupSyncStore';
import {
  SettingsDetailScaffold,
  SettingsPrimaryButton,
} from './SettingsDetailScaffold';

type BackupSyncNavigation = NativeStackNavigationProp<
  RootStackParamList,
  'BackupSync'
>;

export function BackupSyncScreen(): React.JSX.Element {
  const navigation = useNavigation<BackupSyncNavigation>();
  const authMode = useAuthStore(state => state.authMode);
  const email = useAuthStore(state => state.email);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const onboardingCompleted = useAuthStore(
    state => state.onboardingCompleted,
  );
  const autoSyncFrequency = useBackupSyncStore(
    state => state.autoSyncFrequency,
  );
  const lastSyncAt = useBackupSyncStore(state => state.lastSyncAt);
  const setAutoSyncFrequency = useBackupSyncStore(
    state => state.setAutoSyncFrequency,
  );
  const markSynced = useBackupSyncStore(state => state.markSynced);
  const isLoggedIn =
    isAuthenticated && onboardingCompleted && authMode === 'localUser';

  return (
    <SettingsDetailScaffold
      title="Backup & Sync"
      subtitle={
        isLoggedIn
          ? 'Control when Al-Salah prepares your local data for backup and sync.'
          : 'Log in to make backups available for your prayer data and settings.'
      }>
      {isLoggedIn ? (
        <LoggedInBackupSync
          email={email}
          lastSyncAt={lastSyncAt}
          autoSyncFrequency={autoSyncFrequency}
          onSyncNow={() => markSynced()}
          onChangeFrequency={setAutoSyncFrequency}
        />
      ) : (
        <LoggedOutBackupSync
          onLogin={() =>
            navigation.navigate('Login', {
              entry: 'backupSync',
              returnTo: 'BackupSync',
            })
          }
        />
      )}
    </SettingsDetailScaffold>
  );
}

function LoggedOutBackupSync({
  onLogin,
}: {
  onLogin: () => void;
}): React.JSX.Element {
  return (
    <>
      <View style={styles.statusCard}>
        <View style={styles.statusIcon}>
          <Icon name="cloud" color={colors.primary} />
        </View>
        <View style={styles.statusText}>
          <AppText variant="bodyLarge" weight="700">
            Login required
          </AppText>
          <AppText variant="body" color="onSurfaceVariant">
            Your app works offline without an account. Login when you want to
            prepare cloud backup and multi-device sync.
          </AppText>
        </View>
      </View>

      <SettingsPrimaryButton label="Log In" onPress={onLogin} />
    </>
  );
}

function LoggedInBackupSync({
  email,
  lastSyncAt,
  autoSyncFrequency,
  onSyncNow,
  onChangeFrequency,
}: {
  email: string | null;
  lastSyncAt: string | null;
  autoSyncFrequency: BackupSyncFrequency;
  onSyncNow: () => void;
  onChangeFrequency: (frequency: BackupSyncFrequency) => void;
}): React.JSX.Element {
  return (
    <>
      <View style={styles.statusCard}>
        <View style={styles.statusIcon}>
          <Icon name="checkCircle" color={colors.primary} />
        </View>
        <View style={styles.statusText}>
          <AppText variant="bodyLarge" weight="700">
            Backup ready
          </AppText>
          <AppText variant="body" color="onSurfaceVariant">
            {email ?? 'Local account'}
          </AppText>
          <AppText variant="label" color="primary" weight="700">
            Last sync: {formatLastSync(lastSyncAt)}
          </AppText>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={onSyncNow}
        style={({ pressed }) => [
          styles.syncButton,
          pressed && styles.pressed,
        ]}>
        <Icon name="rotate" color={colors.onPrimaryContainer} />
        <AppText variant="label" color="onPrimaryContainer" weight="700">
          Sync Now
        </AppText>
      </Pressable>

      <View style={styles.sectionHeader}>
        <AppText variant="label" color="primary" transform="uppercase">
          Automatic Sync
        </AppText>
        <AppText variant="body" color="onSurfaceVariant">
          Choose when Al-Salah should sync automatically.
        </AppText>
      </View>

      <View style={styles.options}>
        {BACKUP_SYNC_OPTIONS.map(option => (
          <BackupSyncOptionRow
            key={option.key}
            option={option}
            selected={option.key === autoSyncFrequency}
            onPress={() => onChangeFrequency(option.key)}
          />
        ))}
      </View>
    </>
  );
}

function BackupSyncOptionRow({
  option,
  selected,
  onPress,
}: {
  option: BackupSyncOption;
  selected: boolean;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionRow,
        selected && styles.optionRowSelected,
        pressed && styles.pressed,
      ]}>
      <View style={styles.optionText}>
        <AppText variant="label" weight="700">
          {option.label}
        </AppText>
        <AppText
          variant="labelSmall"
          color="onSurfaceVariant"
          numberOfLines={1}>
          {option.description}
        </AppText>
      </View>
      <View style={[styles.optionCheck, selected && styles.optionCheckSelected]}>
        {selected ? (
          <Icon name="check" size={15} color={colors.onPrimary} />
        ) : null}
      </View>
    </Pressable>
  );
}

function formatLastSync(value: string | null): string {
  if (!value) {
    return 'Not synced yet';
  }

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return 'Not synced yet';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

const styles = StyleSheet.create({
  statusCard: {
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceLowest,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  statusText: {
    flex: 1,
    gap: spacing.xs,
  },
  syncButton: {
    minHeight: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  sectionHeader: {
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
  options: {
    gap: spacing.sm,
  },
  optionRow: {
    minHeight: 60,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceLowest,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  optionRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  optionText: {
    flex: 1,
    gap: 1,
  },
  optionCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceLowest,
  },
  optionCheckSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
});
