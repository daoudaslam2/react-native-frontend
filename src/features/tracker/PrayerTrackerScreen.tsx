import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { AppText } from '../../components/AppText';
import { Icon, type IconName } from '../../components/Icon';
import { MissingLocationState } from '../../components/MissingLocationState';
import { Screen } from '../../components/Screen';
import { Surface } from '../../components/Surface';
import type { PrayerLocation } from '../../constants/prayerSettings';
import { OBLIGATORY_PRAYERS, PRAYER_LABELS } from '../../constants/prayers';
import { useNow } from '../../hooks/useNow';
import type { MainTabParamList } from '../../navigation/types';
import { radius, spacing, useThemeColors } from '../../theme';
import {
  getIshaPartCounts,
  getPrayerQazaCount,
  getTotalQaza,
  type QazaCounts,
  useQazaStore,
} from '../qaza/qazaStore';
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
  const location = useSettingsStore(state => state.location);

  if (!location) {
    return <MissingLocationState />;
  }

  return <PrayerTrackerContent location={location} />;
}

function PrayerTrackerContent({
  location,
}: {
  location: PrayerLocation;
}): React.JSX.Element {
  const navigation = useNavigation<TrackerNavigation>();
  const colors = useThemeColors();
  const now = useNow(60_000);
  const logsByDate = useTrackerStore(state => state.logsByDate);
  const ensurePrayerDate = useTrackerStore(state => state.ensurePrayerDate);
  const qazaCounts = useQazaStore(state => state.counts);
  const ishaSplitEnabled = useQazaStore(state => state.ishaSplitEnabled);
  const calculationMethod = useSettingsStore(state => state.calculationMethod);
  const asrMethod = useSettingsStore(state => state.asrMethod);
  const ishaDeadlineMinutes = useSettingsStore(
    state => state.ishaDeadlineMinutes,
  );
  const activeDateKey = getPrayerTrackingDateKey(now, {
    calculationMethod,
    asrMethod,
    ishaDeadlineMinutes,
    location,
  });
  const metrics = getTrackerMetrics({
    activeDateKey,
    logsByDate,
    qazaCounts,
    ishaSplitEnabled,
  });

  useEffect(() => {
    ensurePrayerDate(activeDateKey);
  }, [activeDateKey, ensurePrayerDate]);

  return (
    <Screen patterned contentContainerStyle={styles.screenContent}>
      <View style={styles.header}>
        <AppText variant="display" weight="700">
          Tracker
        </AppText>
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
            <AppText variant="title" weight="700">
              Weekly Completion
            </AppText>
          </View>
          <AppText
            variant="label"
            color="onSurfaceVariant"
            align="right"
            style={styles.sectionSubtitle}>
            {metrics.thirtyDayCompletionPercent}% in 30 days
          </AppText>
        </View>
        <View
          style={[
            styles.chart,
            { borderTopColor: colors.surfaceVariant },
          ]}>
          {metrics.week.map(day => (
            <View key={day.key} style={styles.barWrap}>
              <View
                style={[
                  styles.barTrack,
                  { backgroundColor: colors.surfaceVariant },
                ]}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: `${day.percent}%`,
                      backgroundColor:
                        day.percent < 50 ? colors.error : colors.primary,
                    },
                    day.percent < 50 ? styles.barFillLow : styles.barFillNormal,
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
        <View style={styles.compactGridRow}>
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
        </View>
        <View style={styles.compactGridRow}>
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
      </View>

      <Surface style={styles.qazaEntry} radiusSize="lg">
        <View style={styles.qazaEntryText}>
          <AppText variant="title" weight="700">
            Qaza Balance
          </AppText>
          <View style={styles.qazaBalanceRows}>
            <View style={styles.qazaBalanceRow}>
              <AppText variant="body" color="onSurfaceVariant">
                Total Remaining:
              </AppText>
              <AppText variant="body" color="primary" weight="700">
                {metrics.qazaTotal}
              </AppText>
            </View>
            <View style={styles.qazaBalanceRow}>
              <AppText variant="body" color="onSurfaceVariant">
                Highest:
              </AppText>
              <AppText variant="body" color="primary" weight="700">
                {metrics.highestQazaPrayer}
              </AppText>
            </View>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('Qaza')}
          style={({ pressed }) => [
            styles.qazaButton,
            { backgroundColor: colors.primaryContainer },
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
  const colors = useThemeColors();
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
  const colors = useThemeColors();

  return (
    <Surface style={styles.smallMetricCard} radiusSize="md">
      <View
        style={[
          styles.smallMetricIcon,
          { backgroundColor: colors.primarySoft },
        ]}>
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
  ishaSplitEnabled,
}: {
  activeDateKey: string;
  logsByDate: Record<string, PrayerLogs>;
  qazaCounts: QazaCounts;
  ishaSplitEnabled: boolean;
}): TrackerMetrics {
  const effectiveLogsByDate = {
    ...logsByDate,
    [activeDateKey]: logsByDate[activeDateKey] ?? createInitialPrayerLogs(),
  };
  const completedPrayers = countStatuses(effectiveLogsByDate, ['completed']);
  const qazaPrayers = countStatuses(effectiveLogsByDate, ['qaza']);
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
    trackedDays: countTrackedDays(effectiveLogsByDate),
    qazaTotal: getTotalQaza(qazaCounts, ishaSplitEnabled),
    highestQazaPrayer: getHighestQazaPrayer(
      qazaCounts,
      ishaSplitEnabled,
    ),
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

function getHighestQazaPrayer(
  counts: QazaCounts,
  ishaSplitEnabled: boolean,
): string {
  const ishaPartCounts = getIshaPartCounts(counts);
  const entries: Array<[string, number]> = OBLIGATORY_PRAYERS.flatMap(prayer => {
    if (prayer !== 'isha' || !ishaSplitEnabled) {
      return [[PRAYER_LABELS[prayer], getPrayerQazaCount(counts, prayer)]];
    }

    return [
      ['Isha Fardh', ishaPartCounts.fardh],
      ['Isha Witr', ishaPartCounts.witr],
    ];
  });
  const [highestPrayer, highestCount] = entries.reduce<[string, number]>(
    (highest, [label, count]) => (count > highest[1] ? [label, count] : highest),
    ['Fajr', counts.fajr_fardh],
  );

  return highestCount > 0
    ? `${highestPrayer} (${highestCount})`
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
    alignItems: 'flex-start',
    gap: 0,
  },
  statUnit: {
    marginTop: -spacing.xs,
  },
  weekCard: {
    gap: spacing.sm,
  },
  sectionHeader: {
    alignItems: 'stretch',
    gap: 0,
  },
  sectionSubtitle: {
    alignSelf: 'flex-end',
  },
  chart: {
    height: 118,
    borderTopWidth: StyleSheet.hairlineWidth,
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
  },
  barFill: {
    width: '100%',
  },
  barFillNormal: {
    opacity: 0.85,
  },
  barFillLow: {
    opacity: 0.62,
  },
  compactGrid: {
    gap: spacing.gutter,
  },
  compactGridRow: {
    width: '100%',
    flexDirection: 'row',
    gap: spacing.gutter,
  },
  smallMetricCard: {
    flex: 1,
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
  qazaBalanceRows: {
    gap: 2,
  },
  qazaBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  qazaButton: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
  },
  pressed: {
    opacity: 0.7,
  },
});
