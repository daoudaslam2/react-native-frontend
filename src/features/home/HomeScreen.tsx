import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { AnimatedCard } from '../../components/AnimatedCard';
import { AppText } from '../../components/AppText';
import { Icon, type IconName } from '../../components/Icon';
import { PrayerGradientCard } from '../../components/PrayerGradientCard';
import { Screen } from '../../components/Screen';
import { Surface } from '../../components/Surface';
import { prayerRepository } from '../../services/repositories/prayerRepository';
import { colors, radius, spacing } from '../../theme';
import type { MainTabParamList } from '../../navigation/types';
import type { PrayerTime } from '../../types/prayer';

type HomeNavigation = BottomTabNavigationProp<MainTabParamList, 'Home'>;

export function HomeScreen(): React.JSX.Element {
  const navigation = useNavigation<HomeNavigation>();
  const summary = prayerRepository.getSummary();
  const prayers = prayerRepository
    .getTodayPrayerTimes()
    .filter(prayer => prayer.key !== 'sunrise');

  return (
    <Screen patterned>
      <View style={styles.greeting}>
        <AppText variant="title">As-salamu alaykum, User</AppText>
        <AppText variant="body" color="onSurfaceVariant">
          {summary.hijriDate} • {summary.gregorianDate}
        </AppText>
      </View>

      <AnimatedCard>
        <PrayerGradientCard
          currentPrayer={summary.currentPrayer}
          remainingTime={summary.remainingTime}
          nextPrayer={summary.nextPrayer}
          nextPrayerTime={summary.nextPrayerTime}
        />
      </AnimatedCard>

      <View style={styles.section}>
        <AppText variant="title">Today's Timeline</AppText>
        <View style={styles.list}>
          {prayers.map(prayer => (
            <TimelineRow key={prayer.id} prayer={prayer} />
          ))}
        </View>
      </View>

      <View style={styles.actionsGrid}>
        <ActionCard
          icon="compass"
          label="Qibla"
          tone="secondary"
          onPress={() =>
            navigation.navigate({ name: 'Qibla', params: undefined })
          }
        />
        <ActionCard
          icon="checkCircle"
          label="Mark Complete"
          tone="primary"
          onPress={() =>
            navigation.navigate({
              name: 'TrackerStack',
              params: { screen: 'PrayerTracker' },
            })
          }
        />
        <ActionCard
          icon="chart"
          label="History"
          tone="neutral"
          onPress={() =>
            navigation.navigate({
              name: 'TrackerStack',
              params: { screen: 'PrayerTracker' },
            })
          }
        />
        <ActionCard
          icon="settings"
          label="Settings"
          tone="neutral"
          onPress={() =>
            navigation.navigate({ name: 'Settings', params: undefined })
          }
        />
      </View>
    </Screen>
  );
}

function TimelineRow({ prayer }: { prayer: PrayerTime }): React.JSX.Element {
  const isCurrent = prayer.status === 'current';
  const isCompleted = prayer.status === 'completed';

  return (
    <View
      style={[
        styles.timelineRow,
        isCurrent && styles.timelineRowActive,
        isCompleted && styles.timelineRowDim,
      ]}>
      <View style={styles.timelineLabel}>
        <View
          style={[
            styles.timelineIcon,
            isCurrent && styles.timelineIconActive,
            isCompleted && styles.timelineIconDim,
          ]}>
          <Icon
            name={isCompleted ? 'check' : isCurrent ? 'timer' : 'moon'}
            size={20}
            color={isCurrent ? colors.onPrimary : colors.outline}
          />
        </View>
        <View>
          <AppText
            variant="bodyLarge"
            color={isCurrent ? 'onPrimary' : 'onSurface'}
            weight={isCurrent ? '600' : '400'}>
            {prayer.name}
          </AppText>
          {isCurrent ? (
            <AppText variant="labelSmall" color="primaryFixed">
              Current
            </AppText>
          ) : null}
        </View>
      </View>
      <AppText
        variant={isCurrent ? 'title' : 'body'}
        color={isCurrent ? 'onPrimary' : 'onSurface'}
        weight={isCurrent ? '700' : '400'}>
        {prayer.time}
      </AppText>
    </View>
  );
}

interface ActionCardProps {
  icon: IconName;
  label: string;
  tone: 'primary' | 'secondary' | 'neutral';
  onPress: () => void;
}

function ActionCard({
  icon,
  label,
  tone,
  onPress,
}: ActionCardProps): React.JSX.Element {
  const palette = actionPalette[tone];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.actionPressable, pressed && styles.pressed]}>
      <Surface style={styles.actionCard} radiusSize="xxl">
        <View style={[styles.actionIcon, { backgroundColor: palette.background }]}>
          <Icon name={icon} color={palette.foreground} filled />
        </View>
        <AppText variant="label" weight="600" align="center">
          {label}
        </AppText>
      </Surface>
    </Pressable>
  );
}

const actionPalette = {
  primary: {
    background: colors.primaryContainer,
    foreground: colors.onPrimaryContainer,
  },
  secondary: {
    background: colors.secondaryContainer,
    foreground: colors.onSecondaryContainer,
  },
  neutral: {
    background: colors.surfaceVariant,
    foreground: colors.onSurfaceVariant,
  },
};

const styles = StyleSheet.create({
  greeting: {
    gap: spacing.sm,
    alignItems: 'center',
  },
  section: {
    gap: spacing.md,
  },
  list: {
    gap: spacing.sm,
  },
  timelineRow: {
    minHeight: 64,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    backgroundColor: colors.surfaceContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timelineRowActive: {
    backgroundColor: colors.primary,
    transform: [{ scale: 1.01 }],
  },
  timelineRowDim: {
    opacity: 0.7,
    backgroundColor: colors.surfaceLow,
  },
  timelineLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  timelineIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineIconActive: {
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  timelineIconDim: {
    backgroundColor: colors.surfaceContainer,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.gutter,
  },
  actionPressable: {
    width: '47.6%',
    flexGrow: 1,
  },
  actionCard: {
    width: '100%',
    minHeight: 142,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
});
