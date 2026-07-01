import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../components/AppText';
import { Icon } from '../../components/Icon';
import { LogoMark } from '../../components/LogoMark';
import { PrayerIcon } from '../../components/PrayerIcon';
import { PrayerGradientCard } from '../../components/PrayerGradientCard';
import { Screen } from '../../components/Screen';
import { useNow } from '../../hooks/useNow';
import { prayerRepository } from '../../services/repositories/prayerRepository';
import { colors, radius, spacing } from '../../theme';
import type { ObligatoryPrayerKey, PrayerTime } from '../../types/prayer';
import { formatPrayerTime } from '../../utils/dateTime';
import { useSettingsStore } from '../settings/settingsStore';
import {
  getPrayerTrackingDate,
  getPrayerTrackingDateKey,
  isPrayerActionable,
} from '../tracker/trackerRules';
import {
  type PrayerLogStatus,
  useTrackerStore,
} from '../tracker/trackerStore';

type TimelinePrayer = PrayerTime & { key: ObligatoryPrayerKey };

export function HomeScreen(): React.JSX.Element {
  const now = useNow();
  const use24HourTime = useSettingsStore(state => state.use24HourTime);
  const calculationMethod = useSettingsStore(state => state.calculationMethod);
  const asrMethod = useSettingsStore(state => state.asrMethod);
  const ishaDeadlineMinutes = useSettingsStore(
    state => state.ishaDeadlineMinutes,
  );
  const trackingOptions = {
    calculationMethod,
    asrMethod,
    ishaDeadlineMinutes,
  };
  const trackingDateKey = getPrayerTrackingDateKey(now, trackingOptions);
  const scheduleDate = getPrayerTrackingDate(now, trackingOptions);
  const logs = useTrackerStore(
    state => state.logsByDate[trackingDateKey],
  );
  const ensurePrayerDate = useTrackerStore(state => state.ensurePrayerDate);
  const markPrayer = useTrackerStore(state => state.markPrayer);
  const queryOptions = {
    now,
    scheduleDate,
    calculationMethod,
    asrMethod,
    ishaDeadlineMinutes,
  };
  const summary = prayerRepository.getSummary(queryOptions);
  const prayers = prayerRepository
    .getTodayPrayerTimes(queryOptions)
    .filter(isTimelinePrayer);

  useEffect(() => {
    ensurePrayerDate(trackingDateKey);
  }, [ensurePrayerDate, trackingDateKey]);

  return (
    <Screen patterned contentContainerStyle={styles.screenContent}>
      <HomeHeader />

      <View style={styles.greeting}>
        <AppText variant="title" weight="700">
          As-salamu alaykum, User
        </AppText>
        <AppText variant="body" color="onSurfaceVariant">
          {summary.hijriDate} • {summary.gregorianDate}
        </AppText>
      </View>

      <PrayerGradientCard
        currentPrayer={summary.currentPrayer}
        isPrayerActive={summary.isPrayerActive}
        countdownLabel={summary.countdownLabel}
        remainingTime={summary.remainingTime}
        nextPrayer={summary.nextPrayer}
        nextPrayerTime={formatPrayerTime(
          summary.nextPrayerTime,
          use24HourTime,
        )}
      />

      <View style={styles.section}>
        <AppText variant="title" weight="700">
          Today's Timeline
        </AppText>
        <View style={styles.list}>
          {prayers.map(prayer => (
            <TimelineRow
              key={prayer.id}
              prayer={prayer}
              logStatus={logs?.[prayer.key].status ?? 'pending'}
              use24HourTime={use24HourTime}
              onMarkComplete={() =>
                markPrayer(trackingDateKey, prayer.key, 'completed')
              }
            />
          ))}
        </View>
      </View>
    </Screen>
  );
}

function HomeHeader(): React.JSX.Element {
  return (
    <View style={styles.homeHeader}>
      <LogoMark size={44} />
      <AppText variant="headlineMobile" color="primary" weight="700">
        Al-Salah
      </AppText>
    </View>
  );
}

function TimelineRow({
  prayer,
  logStatus,
  use24HourTime,
  onMarkComplete,
}: {
  prayer: TimelinePrayer;
  logStatus: PrayerLogStatus;
  use24HourTime: boolean;
  onMarkComplete: () => void;
}): React.JSX.Element {
  const isCurrent = prayer.status === 'current';
  const isNext = prayer.status === 'next';
  const isCompleted = logStatus === 'completed';
  const isQaza = logStatus === 'qaza';
  const canMarkComplete =
    (prayer.status === 'current' || prayer.status === 'past') &&
    isPrayerActionable(logStatus);

  return (
    <View
      style={[
        styles.timelineRow,
        isCurrent && styles.timelineRowActive,
        isNext && styles.timelineRowNext,
        prayer.status === 'past' && styles.timelineRowPast,
        isCompleted && styles.timelineRowCompleted,
        isQaza && styles.timelineRowMissed,
      ]}>
      <View style={styles.timelineLabel}>
        <View
          style={[
            styles.timelineIcon,
            isCurrent && styles.timelineIconActive,
          ]}>
          <PrayerIcon name={prayer.key} size={42} />
          {isCompleted ? (
            <View style={styles.completedBadge}>
              <Icon name="check" size={11} color={colors.onPrimary} />
            </View>
          ) : null}
        </View>
        <View>
          <AppText
            variant="bodyLarge"
            color={isCurrent ? 'onPrimary' : 'onSurface'}
            weight={isCurrent ? '600' : '400'}>
            {prayer.name}
          </AppText>
          {isCompleted ? (
            <AppText
              variant="labelSmall"
              color={isCurrent ? 'primaryFixed' : 'primary'}>
              Completed
            </AppText>
          ) : isQaza ? (
            <AppText variant="labelSmall" color="error">
              Qaza
            </AppText>
          ) : isCurrent ? (
            <AppText variant="labelSmall" color="primaryFixed">
              Current
            </AppText>
          ) : isNext ? (
            <AppText variant="labelSmall" color="primary">
              Next
            </AppText>
          ) : prayer.status === 'past' ? (
            <AppText variant="labelSmall" color="onSurfaceVariant">
              Past
            </AppText>
          ) : null}
        </View>
      </View>
      <View style={styles.timelineRight}>
        <AppText
          variant={isCurrent ? 'title' : 'body'}
          color={isCurrent ? 'onPrimary' : 'onSurface'}
          weight={isCurrent ? '700' : '400'}>
          {formatPrayerTime(prayer.time, use24HourTime)}
        </AppText>
        {canMarkComplete ? (
          <Pressable
            accessibilityLabel={`Mark ${prayer.name} complete`}
            accessibilityRole="button"
            onPress={onMarkComplete}
            style={({ pressed }) => [
              styles.markCompleteButton,
              pressed && styles.pressed,
            ]}>
            <Icon name="check" size={18} color={colors.primary} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function isTimelinePrayer(prayer: PrayerTime): prayer is TimelinePrayer {
  return prayer.key !== 'sunrise';
}

const styles = StyleSheet.create({
  screenContent: {
    paddingBottom: 32,
  },
  homeHeader: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.sm,
  },
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
  timelineRowNext: {
    backgroundColor: colors.primarySoft,
  },
  timelineRowPast: {
    opacity: 0.72,
    backgroundColor: colors.surfaceLow,
  },
  timelineRowCompleted: {
    opacity: 1,
  },
  timelineRowMissed: {
    backgroundColor: colors.errorContainer,
  },
  timelineLabel: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  timelineIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineIconActive: {
    transform: [{ scale: 1.04 }],
  },
  completedBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surfaceContainer,
  },
  timelineRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  markCompleteButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.onPrimary,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
});
