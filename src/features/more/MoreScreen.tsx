import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppText } from '../../components/AppText';
import { Icon, type IconName } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import type { RootStackParamList } from '../../navigation/types';
import { resetLocalAppData } from '../../services/localData/resetLocalAppData';
import { colors, radius, spacing } from '../../theme';
import { useAuthStore } from '../auth/authStore';
import {
  type BackupSyncFrequency,
  getBackupSyncFrequencyLabel,
  useBackupSyncStore,
} from '../settings/backupSyncStore';

type MoreNavigation = NativeStackNavigationProp<RootStackParamList>;
type MoreRoute = 'Widgets' | 'Qibla' | 'Settings';

interface MoreModule {
  title: string;
  subtitle: string;
  icon: IconName;
  screen: MoreRoute;
}

const moreModules: MoreModule[] = [
  {
    title: 'Widgets',
    subtitle: 'Android home widgets',
    icon: 'widgets',
    screen: 'Widgets',
  },
  {
    title: 'Qibla',
    subtitle: 'Compass direction',
    icon: 'compass',
    screen: 'Qibla',
  },
  {
    title: 'Settings',
    subtitle: 'Prayer and app options',
    icon: 'settings',
    screen: 'Settings',
  },
];

export function MoreScreen(): React.JSX.Element {
  const navigation = useNavigation<MoreNavigation>();
  const displayName = useAuthStore(state => state.displayName);
  const email = useAuthStore(state => state.email);
  const authMode = useAuthStore(state => state.authMode);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const onboardingCompleted = useAuthStore(
    state => state.onboardingCompleted,
  );
  const autoSyncFrequency = useBackupSyncStore(
    state => state.autoSyncFrequency,
  );
  const isSyncedProfile =
    isAuthenticated && onboardingCompleted && authMode === 'localUser';
  const profileName = displayName.trim() || 'Guest User';
  const profileEmail = isSyncedProfile && email ? email : 'Login to sync';
  const handleLogout = React.useCallback(() => {
    resetLocalAppData().finally(() => {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    });
  }, [navigation]);

  return (
    <Screen contentContainerStyle={styles.content}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <AppText variant="title" color="primary" weight="700">
            {getProfileInitial(profileName)}
          </AppText>
        </View>
        <View style={styles.profileText}>
          <AppText variant="headlineMobile" weight="700" numberOfLines={1}>
            {profileName}
          </AppText>
          <AppText
            variant="body"
            color="onSurfaceVariant"
            numberOfLines={1}
            style={styles.profileEmail}>
            {profileEmail}
          </AppText>
        </View>
        {isSyncedProfile ? (
            <Pressable
              accessibilityLabel="Log out"
              accessibilityRole="button"
              onPress={handleLogout}
              style={({ pressed }) => [
                styles.logoutButton,
                pressed && styles.pressed,
            ]}>
            <Icon name="logout" size={30} color={colors.error} />
            <AppText variant="label" color="error" weight="700">
              Logout
            </AppText>
          </Pressable>
        ) : null}
      </View>

      <ProfileStatusCard
        isSyncedProfile={isSyncedProfile}
        autoSyncFrequency={autoSyncFrequency}
        onPress={() => navigation.navigate('BackupSync')}
      />

      <View style={styles.moduleList}>
        {moreModules.map(module => (
          <ModuleRow
            key={module.screen}
            module={module}
            onPress={() => navigation.navigate(module.screen)}
          />
        ))}
      </View>

    </Screen>
  );
}

function ProfileStatusCard({
  isSyncedProfile,
  autoSyncFrequency,
  onPress,
}: {
  isSyncedProfile: boolean;
  autoSyncFrequency: BackupSyncFrequency;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <View style={styles.statusCard}>
      <View style={styles.statusTopRow}>
        <View style={styles.statusIcon}>
          <Icon
            name={isSyncedProfile ? 'cloud' : 'shield'}
            color={colors.primary}
          />
        </View>
        <View style={styles.statusCopy}>
          <AppText variant="bodyLarge" weight="700">
            {isSyncedProfile ? 'Synced profile' : 'Offline profile'}
          </AppText>
          <AppText variant="body" color="onSurfaceVariant">
            {isSyncedProfile
              ? `Automatic sync: ${getBackupSyncFrequencyLabel(autoSyncFrequency)}`
              : 'Your data stays on this device until you enable backup.'}
          </AppText>
        </View>
        <View style={styles.profileChip}>
          <Icon name="shield" size={15} color={colors.primary} />
          <AppText variant="labelSmall" color="primary" weight="700">
            {isSyncedProfile ? 'Synced' : 'Offline'}
          </AppText>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.statusAction,
          pressed && styles.pressed,
        ]}>
        <AppText variant="label" color="primary" weight="700">
          {isSyncedProfile ? 'Manage Backup & Sync' : 'Set Up Backup & Sync'}
        </AppText>
        <Icon name="chevronRight" size={18} color={colors.primary} />
      </Pressable>
    </View>
  );
}

function ModuleRow({
  module,
  onPress,
}: {
  module: MoreModule;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.moduleRow,
        pressed && styles.pressed,
      ]}>
      <View style={styles.moduleIcon}>
        <Icon name={module.icon} color={colors.primary} />
      </View>
      <View style={styles.moduleText}>
        <AppText variant="bodyLarge" weight="700" numberOfLines={1}>
          {module.title}
        </AppText>
        <AppText variant="label" color="onSurfaceVariant" numberOfLines={2}>
          {module.subtitle}
        </AppText>
      </View>
      <Icon name="chevronRight" size={18} color={colors.onSurfaceVariant} />
    </Pressable>
  );
}

function getProfileInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || 'U';
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  profileText: {
    flex: 1,
    gap: 0,
    paddingTop: 2,
  },
  profileEmail: {
    marginTop: -5,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondaryContainer,
  },
  statusCard: {
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceLowest,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surfaceVariant,
    gap: spacing.md,
    padding: spacing.md,
  },
  statusTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  statusCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  profileChip: {
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  statusAction: {
    minHeight: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  logoutButton: {
    minHeight: 40,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.error,
    backgroundColor: colors.transparent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  moduleList: {
    gap: spacing.sm,
  },
  moduleRow: {
    minHeight: 72,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surfaceVariant,
    backgroundColor: colors.surfaceLowest,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  moduleIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  moduleText: {
    flex: 1,
    gap: 1,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
});
