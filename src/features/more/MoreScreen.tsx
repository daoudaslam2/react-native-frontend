import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppText } from '../../components/AppText';
import { Icon, type IconName } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import { Surface } from '../../components/Surface';
import type { MoreStackParamList } from '../../navigation/types';
import { colors, radius, spacing } from '../../theme';

type MoreNavigation = NativeStackNavigationProp<MoreStackParamList, 'MoreHome'>;

interface MoreItem {
  title: string;
  subtitle: string;
  icon: IconName;
  screen: keyof Omit<MoreStackParamList, 'MoreHome'>;
}

const moreItems: MoreItem[] = [
  {
    title: 'Qibla Compass',
    subtitle: 'Direction to Makkah and calibration',
    icon: 'compass',
    screen: 'Qibla',
  },
  {
    title: 'Prayer Tracker',
    subtitle: 'Daily logs, streaks and history',
    icon: 'chart',
    screen: 'PrayerTracker',
  },
  {
    title: 'Settings',
    subtitle: 'Prayer methods, reminders and privacy',
    icon: 'settings',
    screen: 'Settings',
  },
];

export function MoreScreen(): React.JSX.Element {
  const navigation = useNavigation<MoreNavigation>();

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.profileAvatar}>
          <AppText variant="headlineMobile" color="primary" weight="700">
            U
          </AppText>
        </View>
        <View style={styles.headerText}>
          <AppText variant="headlineMobile">More</AppText>
          <AppText variant="bodyLarge" color="onSurfaceVariant">
            Tools, preferences and account options
          </AppText>
        </View>
      </View>

      <Surface style={styles.profileCard} radiusSize="lg">
        <View style={styles.profileCopy}>
          <AppText variant="title">Local Profile</AppText>
          <AppText variant="body" color="onSurfaceVariant">
            Al-Salah is running locally with dummy data. Sync can be added later
            without changing the screen layer.
          </AppText>
        </View>
        <View style={styles.localBadge}>
          <Icon name="shield" size={16} color={colors.primary} />
          <AppText variant="labelSmall" color="primary">
            Offline
          </AppText>
        </View>
      </Surface>

      <View style={styles.items}>
        {moreItems.map(item => (
          <MoreRow
            key={item.screen}
            item={item}
            onPress={() => navigation.navigate(item.screen)}
          />
        ))}
      </View>
    </Screen>
  );
}

function MoreRow({
  item,
  onPress,
}: {
  item: MoreItem;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}>
      <Surface style={styles.row} radiusSize="lg">
        <View style={styles.rowIcon}>
          <Icon name={item.icon} color={colors.primary} filled />
        </View>
        <View style={styles.rowText}>
          <AppText variant="bodyLarge" weight="500">
            {item.title}
          </AppText>
          <AppText variant="body" color="onSurfaceVariant">
            {item.subtitle}
          </AppText>
        </View>
        <Icon name="chevronRight" color={colors.onSurfaceVariant} />
      </Surface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondaryContainer,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs,
  },
  profileCard: {
    gap: spacing.md,
  },
  profileCopy: {
    gap: spacing.sm,
  },
  localBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0, 106, 57, 0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  items: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondaryContainer,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
});
