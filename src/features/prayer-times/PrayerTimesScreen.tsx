import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../components/AppText';
import { Icon } from '../../components/Icon';
import { MetricChip } from '../../components/MetricChip';
import { MissingLocationState } from '../../components/MissingLocationState';
import { PrayerIcon } from '../../components/PrayerIcon';
import { Screen } from '../../components/Screen';
import type { PrayerLocation } from '../../constants/prayerSettings';
import { useNow } from '../../hooks/useNow';
import { prayerRepository } from '../../services/repositories/prayerRepository';
import { colors, radius, spacing } from '../../theme';
import type {
  ObligatoryPrayerKey,
  PrayerKey,
  PrayerTime,
} from '../../types/prayer';
import { formatPrayerTime } from '../../utils/dateTime';
import { useSettingsStore } from '../settings/settingsStore';
import { getPrayerTrackingDate } from '../tracker/trackerRules';

export function PrayerTimesScreen(): React.JSX.Element {
  const location = useSettingsStore(state => state.location);

  if (!location) {
    return <MissingLocationState />;
  }

  return <PrayerTimesContent location={location} />;
}

function PrayerTimesContent({
  location,
}: {
  location: PrayerLocation;
}): React.JSX.Element {
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
    location,
  };
  const queryOptions = {
    now,
    scheduleDate: getPrayerTrackingDate(now, trackingOptions),
    calculationMethod,
    asrMethod,
    ishaDeadlineMinutes,
    location,
  };
  const summary = prayerRepository.getSummary(queryOptions);
  const prayers = prayerRepository.getTodayPrayerTimes(queryOptions);

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.locationRow}>
          <View style={styles.locationText}>
            <View style={styles.locationTitle}>
              <Icon name="location" size={18} color={colors.primary} filled />
              <AppText variant="title" color="primary" weight="700">
                {summary.location}
              </AppText>
            </View>
            <AppText variant="body" color="onSurfaceVariant">
              {summary.hijriDate} • {summary.gregorianDate}
            </AppText>
          </View>
          <Pressable style={styles.calendarButton}>
            <Icon name="calendar" color={colors.primary} />
          </Pressable>
        </View>
        <MetricChip icon="timer" label={summary.calculationMethod} />
      </View>

      <View style={styles.list}>
        {prayers.map(prayer => (
          <View key={prayer.id}>
            <PrayerTimeRow prayer={prayer} use24HourTime={use24HourTime} />
          </View>
        ))}
      </View>
    </Screen>
  );
}

function PrayerTimeRow({
  prayer,
  use24HourTime,
}: {
  prayer: PrayerTime;
  use24HourTime: boolean;
}): React.JSX.Element {
  const isCurrent = prayer.status === 'current';
  const isNext = prayer.status === 'next';
  const prayerIcon = getPrayerIconName(prayer.key);

  return (
    <View
      style={[
        styles.row,
        isCurrent && styles.rowActive,
        isNext && styles.rowNext,
        prayer.status === 'past' && styles.rowPast,
      ]}>
      <View style={styles.rowLeft}>
        <View style={[styles.iconWrap, isCurrent && styles.iconWrapActive]}>
          {prayerIcon ? (
            <PrayerIcon name={prayerIcon} size={isCurrent ? 52 : 44} />
          ) : (
            <Icon
              name="sun"
              color={isCurrent ? colors.onPrimary : colors.secondary}
              filled
            />
          )}
        </View>
        <View style={styles.rowTitle}>
          <View style={styles.nameLine}>
            <AppText
              variant="title"
              color={isCurrent ? 'onPrimary' : 'onSurface'}
              weight={isCurrent ? '600' : '500'}>
              {prayer.name}
            </AppText>
            {isCurrent ? <View style={styles.activeDot} /> : null}
          </View>
          {isCurrent ? (
            <View style={styles.startsIn}>
              <AppText variant="labelSmall" style={styles.startsInText}>
                Current
              </AppText>
            </View>
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
      <AppText
        variant={isCurrent ? 'headline' : 'headlineMobile'}
        color={isCurrent ? 'onPrimary' : 'onSurface'}>
        {formatPrayerTime(prayer.time, use24HourTime)}
      </AppText>
    </View>
  );
}

function getPrayerIconName(key: PrayerKey): ObligatoryPrayerKey | null {
  return key === 'sunrise' ? null : key;
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.md,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  locationText: {
    flex: 1,
    gap: spacing.xs,
  },
  locationTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  calendarButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceHighest,
  },
  list: {
    gap: spacing.md,
  },
  row: {
    minHeight: 92,
    borderRadius: radius.xl,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceLowest,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surfaceContainer,
    shadowColor: '#000000',
    shadowOpacity: 0.03,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  rowActive: {
    minHeight: 104,
    backgroundColor: colors.primary,
    borderColor: colors.primaryContainer,
    shadowColor: colors.primary,
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
  },
  rowNext: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryFixedDim,
  },
  rowPast: {
    opacity: 0.68,
  },
  rowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  rowTitle: {
    gap: spacing.xs,
  },
  nameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.goldSoft,
  },
  startsIn: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  startsInText: {
    color: 'rgba(255,255,255,0.9)',
  },
});
