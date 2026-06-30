import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { AppText } from '../../components/AppText';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import { Surface } from '../../components/Surface';
import { OBLIGATORY_PRAYERS, PRAYER_LABELS } from '../../constants/prayers';
import type { MainTabParamList } from '../../navigation/types';
import { prayerRepository } from '../../services/repositories/prayerRepository';
import { colors, radius, spacing } from '../../theme';
import type { ObligatoryPrayerKey } from '../../types/prayer';
import { useQazaStore } from '../qaza/qazaStore';
import {
  type PrayerLogStatus,
  useTrackerStore,
} from './trackerStore';

type TrackerNavigation = BottomTabNavigationProp<MainTabParamList, 'Tracker'>;

export function PrayerTrackerScreen(): React.JSX.Element {
  const navigation = useNavigation<TrackerNavigation>();
  const stats = prayerRepository.getTrackerStats();
  const qazaCounts = useQazaStore(state => state.counts);
  const qazaTotal = OBLIGATORY_PRAYERS.reduce(
    (total, prayer) => total + qazaCounts[prayer],
    0,
  );

  return (
    <Screen patterned>
      <View style={styles.header}>
        <AppText variant="display">Tracker</AppText>
        <AppText variant="bodyLarge" color="onSurfaceVariant">
          Your spiritual consistency
        </AppText>
      </View>

      <View style={styles.statsGrid}>
        <Surface style={styles.streakCard} radiusSize="md">
          <View style={styles.statLabel}>
            <Icon name="fire" color={colors.gold} filled />
            <AppText variant="label" color="gold" weight="700">
              Current Streak
            </AppText>
          </View>
          <View style={styles.statValue}>
            <AppText variant="display">{stats.currentStreakDays}</AppText>
            <AppText variant="body" color="onSurfaceVariant" style={styles.statUnit}>
              Days
            </AppText>
          </View>
        </Surface>

        <Surface style={styles.completionCard} radiusSize="md">
          <View style={styles.completionHeader}>
            <View style={styles.statLabel}>
              <Icon name="task" color={colors.primary} filled />
              <AppText variant="label" color="primary" weight="700">
                Monthly Completion
              </AppText>
            </View>
            <AppText variant="headlineMobile">
              {stats.monthlyCompletionPercent}%
            </AppText>
          </View>
          <View style={styles.chart}>
            {stats.weeklyCompletion.map(day => (
              <View key={`${day.day}-${day.percent}`} style={styles.barWrap}>
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
                  color={day.isToday ? 'primary' : 'onSurfaceVariant'}
                  weight={day.isToday ? '700' : '600'}>
                  {day.day}
                </AppText>
              </View>
            ))}
          </View>
        </Surface>
      </View>

      <View style={styles.section}>
        <AppText variant="title">Today's Prayers</AppText>
        <View style={styles.prayers}>
          {OBLIGATORY_PRAYERS.map(prayer => (
            <TrackerPrayerRow key={prayer} prayer={prayer} />
          ))}
        </View>
      </View>

      <Surface style={styles.qazaEntry} radiusSize="lg">
        <View style={styles.qazaEntryText}>
          <AppText variant="title">Qaza Counter</AppText>
          <AppText variant="body" color="onSurfaceVariant">
            {qazaTotal} missed prayers remaining
          </AppText>
        </View>
        <Pressable
          onPress={() =>
            navigation.navigate({
              name: 'Qaza',
              params: { screen: 'QazaHome' },
            })
          }
          style={styles.qazaButton}>
          <AppText variant="label" color="onPrimaryContainer">
            Manage
          </AppText>
        </Pressable>
      </Surface>
    </Screen>
  );
}

function TrackerPrayerRow({
  prayer,
}: {
  prayer: ObligatoryPrayerKey;
}): React.JSX.Element {
  const log = useTrackerStore(state => state.logs[prayer]);
  const markPrayer = useTrackerStore(state => state.markPrayer);
  const qazaComplete = useQazaStore(state => state.completeOne);
  const isCompleted = log.status === 'completed';
  const isCurrent = prayer === 'dhuhr' && log.status === 'pending';
  const isUpcoming = log.status === 'upcoming';

  return (
    <Surface
      radiusSize="md"
      elevated={isCurrent || isCompleted}
      style={[
        styles.prayerRow,
        isCompleted && styles.prayerRowCompleted,
        isUpcoming && styles.prayerRowUpcoming,
        isCurrent && styles.prayerRowCurrent,
      ]}>
      <View style={styles.prayerRowHeader}>
        <View>
          <AppText variant="bodyLarge" weight="500">
            {PRAYER_LABELS[prayer]}
          </AppText>
          <AppText variant="label" color="onSurfaceVariant">
            {displayPrayerTime(prayer)}
          </AppText>
        </View>
        {renderStatus(log.status)}
      </View>
      {isCurrent ? (
        <View style={styles.logOptions}>
          <LogButton label="Congregation" onPress={() => markPrayer(prayer, 'completed')} />
          <LogButton label="On Time" onPress={() => markPrayer(prayer, 'completed')} />
          <LogButton label="Late" onPress={() => markPrayer(prayer, 'late')} />
          <LogButton
            label="Qaza"
            danger
            onPress={() => {
              markPrayer(prayer, 'qaza');
              qazaComplete(prayer);
            }}
          />
        </View>
      ) : null}
    </Surface>
  );
}

function LogButton({
  label,
  danger = false,
  onPress,
}: {
  label: string;
  danger?: boolean;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.logButton,
        danger && styles.logButtonDanger,
        pressed && styles.pressed,
      ]}>
      <AppText variant="labelSmall" color={danger ? 'error' : 'onSurfaceVariant'}>
        {label}
      </AppText>
    </Pressable>
  );
}

function renderStatus(status: PrayerLogStatus): React.JSX.Element {
  if (status === 'completed') {
    return (
      <View style={styles.completedPill}>
        <Icon name="check" size={16} color={colors.primaryContainer} />
        <AppText variant="labelSmall" color="primary">
          Completed
        </AppText>
      </View>
    );
  }

  if (status === 'late') {
    return (
      <View style={styles.neutralPill}>
        <AppText variant="labelSmall" color="onSurfaceVariant">
          Late
        </AppText>
      </View>
    );
  }

  if (status === 'qaza' || status === 'missed') {
    return (
      <View style={styles.errorPill}>
        <AppText variant="labelSmall" color="error">
          Qaza
        </AppText>
      </View>
    );
  }

  if (status === 'upcoming') {
    return (
      <AppText variant="labelSmall" color="onSurfaceVariant">
        Upcoming
      </AppText>
    );
  }

  return (
    <View style={styles.currentActions}>
      <Pressable style={styles.iconAction}>
        <Icon name="close" size={18} color={colors.onSurfaceVariant} />
      </Pressable>
      <Pressable style={styles.iconAction}>
        <Icon name="timer" size={18} color={colors.onSurfaceVariant} />
      </Pressable>
      <Pressable style={styles.logPrimary}>
        <Icon name="check" size={18} color={colors.onPrimary} />
        <AppText variant="label" color="onPrimary">
          Log
        </AppText>
      </Pressable>
    </View>
  );
}

function displayPrayerTime(prayer: ObligatoryPrayerKey): string {
  const times: Record<ObligatoryPrayerKey, string> = {
    fajr: '5:12 AM',
    dhuhr: '12:34 PM',
    asr: '4:15 PM',
    maghrib: '6:45 PM',
    isha: '8:10 PM',
  };

  return times[prayer];
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
  },
  statsGrid: {
    gap: spacing.gutter,
  },
  streakCard: {
    gap: spacing.md,
  },
  completionCard: {
    gap: spacing.lg,
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
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chart: {
    height: 116,
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
    height: 80,
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
    opacity: 0.6,
  },
  section: {
    gap: spacing.md,
  },
  prayers: {
    gap: spacing.sm,
  },
  prayerRow: {
    gap: spacing.md,
    borderLeftWidth: 0,
  },
  prayerRowCompleted: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  prayerRowUpcoming: {
    opacity: 0.62,
  },
  prayerRowCurrent: {
    backgroundColor: colors.surfaceLowest,
  },
  prayerRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  completedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0, 134, 73, 0.12)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  neutralPill: {
    borderRadius: radius.full,
    backgroundColor: colors.surfaceHigh,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  errorPill: {
    borderRadius: radius.full,
    backgroundColor: colors.errorContainer,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  currentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceVariant,
  },
  logPrimary: {
    height: 40,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
  },
  logOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.surfaceVariant,
    paddingTop: spacing.md,
  },
  logButton: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.outlineVariant,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  logButtonDanger: {
    borderColor: colors.errorContainer,
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
