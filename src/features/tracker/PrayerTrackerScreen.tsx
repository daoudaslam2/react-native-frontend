import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { AppText } from '../../components/AppText';
import { Icon, type IconName } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import { Surface } from '../../components/Surface';
import { OBLIGATORY_PRAYERS, PRAYER_LABELS } from '../../constants/prayers';
import { useNow } from '../../hooks/useNow';
import type { MainTabParamList } from '../../navigation/types';
import { colors, radius, spacing } from '../../theme';
import type { ObligatoryPrayerKey } from '../../types/prayer';
import { getTotalQaza, type QazaCounts, useQazaStore } from '../qaza/qazaStore';
import { useSettingsStore } from '../settings/settingsStore';
import {
  createInitialPrayerLogs,
  formatDateKey,
  getPrayerTrackingDateKey,
  type PrayerLogs,
} from './trackerRules';
import { type PrayerLogStatus, useTrackerStore } from './trackerStore';

type TrackerNavigation = BottomTabNavigationProp<MainTabParamList, 'Tracker'>;

interface TrackerMetrics {
  currentStreakDays: number;
  bestStreakDays: number;
  sevenDayCompletionPercent: number;
  thirtyDayCompletionPercent: number;
  completedPrayers: number;
  qazaPrayers: number;
  pendingPrayers: number;
  trackedDays: number;
  qazaTotal: number;
  highestQazaPrayer: string;
  week: ReadonlyArray<{
    key: string;
    label: string;
    percent: number;
    isCurrent: boolean;
  }>;
}

export function PrayerTrackerScreen(): React.JSX.Element {
  const navigation = useNavigation<TrackerNavigation>();
  const now = useNow(60_000);
  const logsByDate = useTrackerStore(state => state.logsByDate);
  const ensurePrayerDate = useTrackerStore(state => state.ensurePrayerDate);
  const qazaCounts = useQazaStore(state => state.counts);
  const calculationMethod = useSettingsStore(state => state.calculationMethod);
  const asrMethod = useSettingsStore(state => state.asrMethod);
  const ishaDeadlineMinutes = useSettingsStore(
    state => state.ishaDeadlineMinutes,
  );
  const activeDateKey = getPrayerTrackingDateKey(now, {
    calculationMethod,
    asrMethod,
    ishaDeadlineMinutes,
  });
  const metrics = getTrackerMetrics({
    activeDateKey,
    logsByDate,
    qazaCounts,
  });

  useEffect(() => {
    ensurePrayerDate(activeDateKey);
  }, [activeDateKey, ensurePrayerDate]);

  return (
    <Screen patterned contentContainerStyle={styles.screenContent}>
      <View style={styles.header}>
        <AppText variant="display">Tracker</AppText>
        <AppText variant="bodyLarge" color="onSurfaceVariant">
          Your prayer consistency at a glance
        </AppText>
      </View>

      <View style={styles.heroGrid}>
        <MetricCard
          icon="fire"
          tone="gold"
          label="Current Streak"
          value={metrics.currentStreakDays.toString()}
          suffix="days"
        />
        <MetricCard
          icon="task"
          tone="primary"
          label="Last 7 Days"
          value={`${metrics.sevenDayCompletionPercent}%`}
          suffix="complete"
        />
      </View>

      <Surface style={styles.weekCard} radiusSize="lg">
        <View style={styles.sectionHeader}>
          <View style={styles.statLabel}>
            <Icon name="chart" color={colors.primary} />
            <AppText variant="title">Weekly Completion</AppText>
          </View>
          <AppText variant="label" color="onSurfaceVariant">
            {metrics.thirtyDayCompletionPercent}% in 30 days
          </AppText>
        </View>
        <View style={styles.chart}>
          {metrics.week.map(day => (
            <View key={day.key} style={styles.barWrap}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { height: `${day.percent}%` },
                    day.percent < 50 && styles.barLow,
                  ]}
                />
              </View>
              <AppText
                variant="labelSmall"
                color={day.isCurrent ? 'primary' : 'onSurfaceVariant'}
                weight={day.isCurrent ? '700' : '600'}>
                {day.label}
              </AppText>
            </View>
          ))}
        </View>
      </Surface>

      <View style={styles.compactGrid}>
        <SmallMetricCard
          icon="checkCircle"
          label="Completed"
          value={metrics.completedPrayers.toString()}
        />
        <SmallMetricCard
          icon="task"
          label="Qaza Logged"
          value={metrics.qazaPrayers.toString()}
        />
        <SmallMetricCard
          icon="timer"
          label="Pending"
          value={metrics.pendingPrayers.toString()}
        />
        <SmallMetricCard
          icon="calendar"
          label="Tracked Days"
          value={metrics.trackedDays.toString()}
        />
        <SmallMetricCard
          icon="chart"
          label="Best Streak"
          value={metrics.bestStreakDays.toString()}
        />
      </View>

      <Surface style={styles.qazaEntry} radiusSize="lg">
        <View style={styles.qazaEntryText}>
          <AppText variant="title">Qaza Balance</AppText>
          <AppText variant="body" color="onSurfaceVariant">
            {metrics.qazaTotal} remaining - Highest: {metrics.highestQazaPrayer}
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('Qaza')}
          style={({ pressed }) => [
            styles.qazaButton,
            pressed && styles.pressed,
          ]}>
          <AppText variant="label" color="onPrimaryContainer">
            Manage
          </AppText>
        </Pressable>
      </Surface>
    </Screen>
  );
}

function MetricCard({
  icon,
  tone,
  label,
  value,
  suffix,
}: {
  icon: IconName;
  tone: 'primary' | 'gold';
  label: string;
  value: string;
  suffix: string;
}): React.JSX.Element {
  const toneColor = tone === 'gold' ? colors.gold : colors.primary;

  return (
    <Surface style={styles.metricCard} radiusSize="md">
      <View style={styles.statLabel}>
        <Icon name={icon} color={toneColor} filled />
        <AppText variant="label" color={tone} weight="700">
          {label}
        </AppText>
      </View>
      <View style={styles.statValue}>
        <AppText variant="display">{value}</AppText>
        <AppText variant="body" color="onSurfaceVariant" style={styles.statUnit}>
          {suffix}
        </AppText>
      </View>
    </Surface>
  );
}

function SmallMetricCard({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: string;
}): React.JSX.Element {
  return (
    <Surface style={styles.smallMetricCard} radiusSize="md">
      <View style={styles.smallMetricIcon}>
        <Icon name={icon} color={colors.primary} />
      </View>
      <AppText variant="headlineMobile" weight="700">
        {value}
      </AppText>
      <AppText variant="labelSmall" color="onSurfaceVariant" align="center">
        {label}
      </AppText>
    </Surface>
  );
}

function getTrackerMetrics({
  activeDateKey,
  logsByDate,
  qazaCounts,
}: {
  activeDateKey: string;
  logsByDate: Record<string, PrayerLogs>;
  qazaCounts: QazaCounts;
}): TrackerMetrics {
  const effectiveLogsByDate = {
    ...logsByDate,
    [activeDateKey]: logsByDate[activeDateKey] ?? createInitialPrayerLogs(),
  };
  const activeLogs = effectiveLogsByDate[activeDateKey];
  const completedPrayers = countStatuses(effectiveLogsByDate, ['completed']);
  const qazaPrayers = countStatuses(effectiveLogsByDate, ['qaza']);
  const pendingPrayers = countPrayerStatuses(activeLogs, [
    'pending',
    'upcoming',
  ]);
  const weekKeys = getDateRange(activeDateKey, 7);
  const thirtyDayKeys = getDateRange(activeDateKey, 30);

  return {
    currentStreakDays: getCurrentStreakDays(activeDateKey, effectiveLogsByDate),
    bestStreakDays: getBestStreakDays(effectiveLogsByDate),
    sevenDayCompletionPercent: getCompletionPercent(
      weekKeys,
      effectiveLogsByDate,
    ),
    thirtyDayCompletionPercent: getCompletionPercent(
      thirtyDayKeys,
      effectiveLogsByDate,
    ),
    completedPrayers,
    qazaPrayers,
    pendingPrayers,
    trackedDays: countTrackedDays(effectiveLogsByDate),
    qazaTotal: getTotalQaza(qazaCounts),
    highestQazaPrayer: getHighestQazaPrayer(qazaCounts),
    week: weekKeys.map(key => ({
      key,
      label: formatWeekdayLabel(key),
      percent: getDayCompletionPercent(effectiveLogsByDate[key]),
      isCurrent: key === activeDateKey,
    })),
  };
}

function countStatuses(
  logsByDate: Record<string, PrayerLogs>,
  statuses: ReadonlyArray<PrayerLogStatus>,
): number {
  return Object.values(logsByDate).reduce((total, logs) => {
    return total + countPrayerStatuses(logs, statuses);
  }, 0);
}

function countPrayerStatuses(
  logs: PrayerLogs,
  statuses: ReadonlyArray<PrayerLogStatus>,
): number {
  return OBLIGATORY_PRAYERS.filter(prayer =>
    statuses.includes(logs[prayer].status),
  ).length;
}

function countTrackedDays(logsByDate: Record<string, PrayerLogs>): number {
  return Object.values(logsByDate).filter(logs =>
    OBLIGATORY_PRAYERS.some(prayer => isLoggedStatus(logs[prayer].status)),
  ).length;
}

function getCurrentStreakDays(
  activeDateKey: string,
  logsByDate: Record<string, PrayerLogs>,
): number {
  let streak = 0;
  let cursor = isCompleteDay(logsByDate[activeDateKey])
    ? activeDateKey
    : addDaysToDateKey(activeDateKey, -1);

  while (isCompleteDay(logsByDate[cursor])) {
    streak += 1;
    cursor = addDaysToDateKey(cursor, -1);
  }

  return streak;
}

function getBestStreakDays(logsByDate: Record<string, PrayerLogs>): number {
  const dateKeys = Object.keys(logsByDate).sort();
  let bestStreak = 0;
  let currentStreak = 0;
  let previousKey: string | null = null;

  dateKeys.forEach(dateKey => {
    if (previousKey && dateKey !== addDaysToDateKey(previousKey, 1)) {
      currentStreak = 0;
    }

    currentStreak = isCompleteDay(logsByDate[dateKey])
      ? currentStreak + 1
      : 0;
    bestStreak = Math.max(bestStreak, currentStreak);
    previousKey = dateKey;
  });

  return bestStreak;
}

function getCompletionPercent(
  dateKeys: ReadonlyArray<string>,
  logsByDate: Record<string, PrayerLogs>,
): number {
  const completed = dateKeys.reduce((total, dateKey) => {
    return total + getCompletedPrayerCount(logsByDate[dateKey]);
  }, 0);

  return Math.round((completed / (dateKeys.length * OBLIGATORY_PRAYERS.length)) * 100);
}

function getDayCompletionPercent(logs?: PrayerLogs): number {
  return Math.round(
    (getCompletedPrayerCount(logs) / OBLIGATORY_PRAYERS.length) * 100,
  );
}

function getCompletedPrayerCount(logs?: PrayerLogs): number {
  if (!logs) {
    return 0;
  }

  return OBLIGATORY_PRAYERS.filter(prayer =>
    isCompletedStatus(logs[prayer].status),
  ).length;
}

function isCompleteDay(logs?: PrayerLogs): boolean {
  return getCompletedPrayerCount(logs) === OBLIGATORY_PRAYERS.length;
}

function isCompletedStatus(status: PrayerLogStatus): boolean {
  return status === 'completed';
}

function isLoggedStatus(status: PrayerLogStatus): boolean {
  return status === 'completed' || status === 'qaza';
}

function getHighestQazaPrayer(counts: QazaCounts): string {
  const [highestPrayer, highestCount] = OBLIGATORY_PRAYERS.reduce<
    [ObligatoryPrayerKey, number]
  >(
    (highest, prayer) =>
      counts[prayer] > highest[1] ? [prayer, counts[prayer]] : highest,
    ['fajr', counts.fajr],
  );

  return highestCount > 0
    ? `${PRAYER_LABELS[highestPrayer]} (${highestCount})`
    : 'None';
}

function getDateRange(endDateKey: string, days: number): string[] {
  return Array.from({ length: days }, (_, index) =>
    addDaysToDateKey(endDateKey, index - days + 1),
  );
}

function addDaysToDateKey(dateKey: string, dayOffset: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + dayOffset, 12));

  return formatDateKey(date);
}

function formatWeekdayLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));

  return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
}

const styles = StyleSheet.create({
  screenContent: {
    paddingBottom: 32,
  },
  header: {
    gap: spacing.sm,
  },
  heroGrid: {
    flexDirection: 'row',
    gap: spacing.gutter,
  },
  metricCard: {
    flex: 1,
    minHeight: 132,
    gap: spacing.md,
  },
  statLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statValue: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  statUnit: {
    paddingBottom: spacing.sm,
  },
  weekCard: {
    gap: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  chart: {
    height: 118,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.surfaceVariant,
    paddingTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  barWrap: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
  barTrack: {
    height: 82,
    width: '100%',
    justifyContent: 'flex-end',
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surfaceVariant,
  },
  barFill: {
    width: '100%',
    backgroundColor: colors.primary,
    opacity: 0.85,
  },
  barLow: {
    backgroundColor: colors.error,
    opacity: 0.62,
  },
  compactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.gutter,
  },
  smallMetricCard: {
    width: '47.5%',
    minHeight: 128,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  smallMetricIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  qazaEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  qazaEntryText: {
    flex: 1,
    gap: spacing.xs,
  },
  qazaButton: {
    borderRadius: radius.full,
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
  },
  pressed: {
    opacity: 0.7,
  },
});
