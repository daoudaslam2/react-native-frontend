import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AnimatedCard } from '../../components/AnimatedCard';
import { AppText } from '../../components/AppText';
import { Icon, type IconName } from '../../components/Icon';
import { MetricChip } from '../../components/MetricChip';
import { Screen } from '../../components/Screen';
import { prayerRepository } from '../../services/repositories/prayerRepository';
import { colors, radius, spacing } from '../../theme';
import type { PrayerKey, PrayerTime } from '../../types/prayer';

const prayerIcons: Record<PrayerKey, IconName> = {
  fajr: 'sun',
  sunrise: 'sun',
  dhuhr: 'sun',
  asr: 'cloud',
  maghrib: 'moon',
  isha: 'moon',
};

export function PrayerTimesScreen(): React.JSX.Element {
  const summary = prayerRepository.getSummary();
  const prayers = prayerRepository.getTodayPrayerTimes();

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.locationRow}>
          <View style={styles.locationText}>
            <View style={styles.locationTitle}>
              <Icon name="location" size={18} color={colors.primary} filled />
              <AppText variant="title" color="primary">
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
        {prayers.map((prayer, index) => (
          <AnimatedCard key={prayer.id} delay={index * 45}>
            <PrayerTimeRow prayer={prayer} />
          </AnimatedCard>
        ))}
      </View>
    </Screen>
  );
}

function PrayerTimeRow({ prayer }: { prayer: PrayerTime }): React.JSX.Element {
  const isCurrent = prayer.status === 'current';
  const isCompleted = prayer.status === 'completed';

  return (
    <View
      style={[
        styles.row,
        isCurrent && styles.rowActive,
        isCompleted && styles.rowCompleted,
      ]}>
      <View style={styles.rowLeft}>
        <View style={[styles.iconWrap, isCurrent && styles.iconWrapActive]}>
          <Icon
            name={prayerIcons[prayer.key]}
            color={isCurrent ? colors.onPrimary : colors.primary}
            filled
          />
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
                Starts in 01:25:40
              </AppText>
            </View>
          ) : isCompleted ? (
            <AppText variant="labelSmall" color="onSurfaceVariant">
              Completed
            </AppText>
          ) : null}
        </View>
      </View>
      <AppText
        variant={isCurrent ? 'headline' : 'headlineMobile'}
        color={isCurrent ? 'onPrimary' : 'onSurface'}>
        {prayer.time}
      </AppText>
    </View>
  );
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
  rowCompleted: {
    opacity: 0.62,
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
    backgroundColor: colors.surfaceHigh,
  },
  iconWrapActive: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.18)',
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
