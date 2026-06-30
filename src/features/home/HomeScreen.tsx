import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../components/AppText';
import { Icon } from '../../components/Icon';
import { LogoMark } from '../../components/LogoMark';
import { PrayerIcon } from '../../components/PrayerIcon';
import { PrayerGradientCard } from '../../components/PrayerGradientCard';
import { Screen } from '../../components/Screen';
import { useTrackerStore } from '../tracker/trackerStore';
import { prayerRepository } from '../../services/repositories/prayerRepository';
import { colors, radius, spacing } from '../../theme';
import type { ObligatoryPrayerKey, PrayerTime } from '../../types/prayer';

type TimelinePrayer = PrayerTime & { key: ObligatoryPrayerKey };

export function HomeScreen(): React.JSX.Element {
  const summary = prayerRepository.getSummary();
  const prayers = prayerRepository
    .getTodayPrayerTimes()
    .filter(isTimelinePrayer);
  const logs = useTrackerStore(state => state.logs);
  const markPrayer = useTrackerStore(state => state.markPrayer);

  return (
    <Screen patterned contentContainerStyle={styles.screenContent}>
      <HomeHeader />

      <View style={styles.greeting}>
        <AppText variant="title">As-salamu alaykum, User</AppText>
        <AppText variant="body" color="onSurfaceVariant">
          {summary.hijriDate} • {summary.gregorianDate}
        </AppText>
      </View>

      <PrayerGradientCard
        currentPrayer={summary.currentPrayer}
        remainingTime={summary.remainingTime}
        nextPrayer={summary.nextPrayer}
        nextPrayerTime={summary.nextPrayerTime}
      />

      <View style={styles.section}>
        <AppText variant="title">Today's Timeline</AppText>
        <View style={styles.list}>
          {prayers.map(prayer => (
            <TimelineRow
              key={prayer.id}
              prayer={prayer}
              isMarkedComplete={logs[prayer.key].status === 'completed'}
              onMarkComplete={() => markPrayer(prayer.key, 'completed')}
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
  isMarkedComplete,
  onMarkComplete,
}: {
  prayer: TimelinePrayer;
  isMarkedComplete: boolean;
  onMarkComplete: () => void;
}): React.JSX.Element {
  const isCompleted = prayer.status === 'completed' || isMarkedComplete;
  const isCurrent = prayer.status === 'current' && !isCompleted;

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
          {isCurrent ? (
            <AppText variant="labelSmall" color="primaryFixed">
              Current
            </AppText>
          ) : isCompleted ? (
            <AppText variant="labelSmall" color="onSurfaceVariant">
              Completed
            </AppText>
          ) : null}
        </View>
      </View>
      <View style={styles.timelineRight}>
        <AppText
          variant={isCurrent ? 'title' : 'body'}
          color={isCurrent ? 'onPrimary' : 'onSurface'}
          weight={isCurrent ? '700' : '400'}>
          {prayer.time}
        </AppText>
        {isCurrent ? (
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
  timelineRowDim: {
    opacity: 0.7,
    backgroundColor: colors.surfaceLow,
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
  timelineIconDim: {
    opacity: 0.94,
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
