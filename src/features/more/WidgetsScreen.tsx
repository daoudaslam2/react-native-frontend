import React from 'react';
import {
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppText } from '../../components/AppText';
import { Icon } from '../../components/Icon';
import { PrayerIcon } from '../../components/PrayerIcon';
import { Screen } from '../../components/Screen';
import { OBLIGATORY_PRAYERS } from '../../constants/prayers';
import { FIXED_PRAYER_LOCATION } from '../../constants/prayerSettings';
import { useNow } from '../../hooks/useNow';
import type { MoreStackParamList } from '../../navigation/types';
import { prayerRepository } from '../../services/repositories/prayerRepository';
import { colors, radius, spacing } from '../../theme';
import type { ObligatoryPrayerKey, PrayerTime } from '../../types/prayer';
import { formatPrayerTime } from '../../utils/dateTime';
import { useSettingsStore } from '../settings/settingsStore';
import { getPrayerTrackingDate } from '../tracker/trackerRules';

type WidgetsNavigation = NativeStackNavigationProp<
  MoreStackParamList,
  'Widgets'
>;

type WidgetPrayer = PrayerTime & { key: ObligatoryPrayerKey };

interface WidgetPreviewData {
  current: WidgetPrayer;
  next: WidgetPrayer;
  prayers: WidgetPrayer[];
  currentTime: string;
  displayDate: string;
  hijriDate: string;
  location: string;
  remainingDuration: string;
  remainingTime: string;
  progressPercent: number;
}

const inactiveColor = '#969995';

export function WidgetsScreen(): React.JSX.Element {
  const navigation = useNavigation<WidgetsNavigation>();
  const { width } = useWindowDimensions();
  const now = useNow();
  const use24HourTime = useSettingsStore(state => state.use24HourTime);
  const calculationMethod = useSettingsStore(state => state.calculationMethod);
  const asrMethod = useSettingsStore(state => state.asrMethod);
  const queryOptions = {
    now,
    scheduleDate: getPrayerTrackingDate(now),
    calculationMethod,
    asrMethod,
  };
  const summary = prayerRepository.getSummary(queryOptions);
  const prayers = prayerRepository
    .getTodayPrayerTimes(queryOptions)
    .filter(isWidgetPrayer);
  const previewData = createPreviewData({
    now,
    prayers,
    currentPrayerName: summary.currentPrayer,
    nextPrayerName: summary.nextPrayer,
    nextPrayerTime: summary.nextPrayerTime,
    hijriDate: summary.hijriDate,
    remainingTime: summary.remainingTime,
    use24HourTime,
  });
  const previewWidth = Math.min(width - spacing.container * 2, 330);

  return (
    <Screen contentContainerStyle={styles.screenContent}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Icon name="arrowLeft" size={28} color={colors.primary} />
        </Pressable>
        <AppText variant="headlineMobile" weight="700" align="center">
          Widgets
        </AppText>
      </View>

      <View style={styles.intro}>
        <AppText variant="bodyLarge" color="onSurfaceVariant" align="center">
          Preview the Android widgets available from your home screen widget
          picker.
        </AppText>
      </View>

      <WidgetSection title="Small (2x2)">
        <SmallWidgetPreview data={previewData} size={Math.min(previewWidth, 224)} />
      </WidgetSection>

      <WidgetSection title="Medium (4x2)">
        <MediumWidgetPreview data={previewData} width={previewWidth} />
      </WidgetSection>

      <WidgetSection title="Large (4x4)">
        <LargeWidgetPreview
          data={previewData}
          width={previewWidth}
          use24HourTime={use24HourTime}
        />
      </WidgetSection>
    </Screen>
  );
}

function WidgetSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <View style={styles.section}>
      <AppText
        variant="label"
        color="onSurfaceVariant"
        transform="uppercase"
        weight="700"
        align="center"
        style={styles.sectionTitle}>
        {title}
      </AppText>
      {children}
    </View>
  );
}

function SmallWidgetPreview({
  data,
  size,
}: {
  data: WidgetPreviewData;
  size: number;
}): React.JSX.Element {
  return (
    <View style={[styles.smallWidget, { width: size, height: size }]}>
      <View style={styles.softRingSmall} />
      <View style={styles.smallIconWrap}>
        <PrayerIcon
          name={data.current.key}
          size={50}
          color={colors.onPrimary}
          backgroundColor={colors.primaryContainer}
        />
      </View>
      <View style={styles.smallTopCopy}>
        <AppText variant="headline" weight="700" style={styles.smallCurrentName}>
          {data.current.name}
        </AppText>
        <AppText
          variant="bodyLarge"
          color="primary"
          weight="700"
          style={styles.smallRemaining}>
          {data.remainingDuration} remaining
        </AppText>
      </View>
      <View style={styles.smallFooter}>
        <AppText
          variant="body"
          color="onSurfaceVariant"
          weight="700"
          style={styles.smallNext}>
          Next: {data.next.name}
        </AppText>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${data.progressPercent}%` },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

function MediumWidgetPreview({
  data,
  width,
}: {
  data: WidgetPreviewData;
  width: number;
}): React.JSX.Element {
  return (
    <View style={[styles.mediumWidget, { width }]}>
      <View style={styles.softRingMedium} />
      <View style={styles.mediumTop}>
        <View>
          <AppText variant="display" weight="700" style={styles.mediumTime}>
            {data.currentTime}
          </AppText>
          <AppText
            variant="bodyLarge"
            color="primary"
            weight="700"
            style={styles.mediumStatus}>
            Next: {data.next.name}
          </AppText>
        </View>
        <View style={styles.mediumLocation}>
          <AppText variant="label" color="onSurfaceVariant" weight="700" align="right">
            {data.location}
          </AppText>
          <AppText variant="label" color="onSurfaceVariant" weight="700" align="right">
            {data.hijriDate}
          </AppText>
        </View>
      </View>
      <View style={styles.mediumTimeline}>
        {data.prayers.map(prayer =>
          prayer.key === data.current.key ? (
            <View key={prayer.key} style={styles.mediumActivePrayer}>
              <View style={styles.mediumActiveIcon}>
                <PrayerIcon
                  name={prayer.key}
                  size={40}
                  color={colors.onPrimary}
                  backgroundColor="transparent"
                />
              </View>
              <AppText
                variant="label"
                color="primary"
                weight="700"
                style={styles.mediumPrayerName}>
                {prayer.name}
              </AppText>
            </View>
          ) : (
            <View key={prayer.key} style={styles.mediumInactivePrayer}>
              <PrayerIcon
                name={prayer.key}
                size={28}
                color={inactiveColor}
                backgroundColor="transparent"
              />
              <AppText
                variant="labelSmall"
                color="outline"
                weight="700"
                style={styles.mediumPrayerName}>
                {prayer.name}
              </AppText>
            </View>
          ),
        )}
      </View>
    </View>
  );
}

function LargeWidgetPreview({
  data,
  width,
  use24HourTime,
}: {
  data: WidgetPreviewData;
  width: number;
  use24HourTime: boolean;
}): React.JSX.Element {
  const rows = getLargeRows(data);

  return (
    <View style={[styles.largeWidget, { width }]}>
      <View style={styles.softRingLarge} />
      <View style={styles.dottedRingLarge} />
      <View style={styles.largeHeader}>
        <View>
          <AppText
            variant="title"
            color="onSurfaceVariant"
            weight="700"
            style={styles.largeDate}>
            {data.displayDate}
          </AppText>
          <View style={styles.largeClockRow}>
            <AppText variant="display" weight="700" style={styles.largeTime}>
              {data.currentTime}
            </AppText>
          </View>
        </View>
        <View style={styles.moreButton}>
          <AppText variant="headlineMobile" color="onSurfaceVariant" weight="700">
            ...
          </AppText>
        </View>
      </View>

      <View style={styles.largeRows}>
        <LargeInactiveRow prayer={rows.previous} use24HourTime={use24HourTime} />
        <View style={styles.largeCurrentRow}>
          <View style={styles.currentAccent} />
          <View style={styles.largeCurrentIcon}>
            <PrayerIcon
              name={data.current.key}
              size={48}
              color={colors.onPrimary}
              backgroundColor={colors.primaryContainer}
            />
          </View>
          <View style={styles.largeCurrentText}>
            <AppText
              variant="headline"
              weight="700"
              style={styles.largeCurrentName}>
              {data.current.name}
            </AppText>
            <AppText
              variant="bodyLarge"
              color="primary"
              weight="700"
              style={styles.largeCurrentRemaining}>
              {data.remainingTime}
            </AppText>
          </View>
          <AppText variant="title" weight="700" style={styles.largeCurrentTime}>
            {formatPrayerTime(data.current.time, use24HourTime)}
          </AppText>
        </View>
        <LargeDefaultRow prayer={rows.next} use24HourTime={use24HourTime} />
        <View style={styles.rowDivider} />
        <LargeDefaultRow prayer={rows.afterNext} use24HourTime={use24HourTime} />
      </View>
    </View>
  );
}

function LargeInactiveRow({
  prayer,
  use24HourTime,
}: {
  prayer: WidgetPrayer;
  use24HourTime: boolean;
}): React.JSX.Element {
  return (
    <View style={styles.largeDefaultRow}>
      <PrayerIcon
        name={prayer.key}
        size={42}
        color={inactiveColor}
        backgroundColor="transparent"
      />
      <AppText
        variant="headlineMobile"
        color="outline"
        style={[styles.largeRowName, styles.largeInactiveName]}>
        {prayer.name}
      </AppText>
      <AppText variant="bodyLarge" color="outline" style={styles.largeRowTime}>
        {formatPrayerTime(prayer.time, use24HourTime)}
      </AppText>
    </View>
  );
}

function LargeDefaultRow({
  prayer,
  use24HourTime,
}: {
  prayer: WidgetPrayer;
  use24HourTime: boolean;
}): React.JSX.Element {
  return (
    <View style={styles.largeDefaultRow}>
      <PrayerIcon
        name={prayer.key}
        size={42}
        color={colors.onSurfaceVariant}
        backgroundColor="transparent"
      />
      <AppText
        variant="headlineMobile"
        style={[styles.largeRowName, styles.largeDefaultName]}>
        {prayer.name}
      </AppText>
      <AppText
        variant="bodyLarge"
        color="onSurfaceVariant"
        style={styles.largeRowTime}>
        {formatPrayerTime(prayer.time, use24HourTime)}
      </AppText>
    </View>
  );
}

function createPreviewData({
  now,
  prayers,
  currentPrayerName,
  nextPrayerName,
  nextPrayerTime,
  hijriDate,
  remainingTime,
  use24HourTime,
}: {
  now: Date;
  prayers: WidgetPrayer[];
  currentPrayerName: string;
  nextPrayerName: string;
  nextPrayerTime: string;
  hijriDate: string;
  remainingTime: string;
  use24HourTime: boolean;
}): WidgetPreviewData {
  const current =
    prayers.find(prayer => prayer.status === 'current') ??
    prayers.find(prayer => prayer.name === currentPrayerName) ??
    prayers[0];
  const nextFromSchedule =
    prayers.find(prayer => prayer.status === 'next') ??
    prayers.find(prayer => prayer.name === nextPrayerName) ??
    prayers[(prayers.indexOf(current) + 1) % prayers.length];
  const next =
    nextFromSchedule.status === 'next'
      ? nextFromSchedule
      : {
          ...nextFromSchedule,
          time: nextPrayerTime,
          displayTime: nextPrayerTime,
          status: 'next' as const,
        };

  return {
    current,
    next,
    prayers,
    currentTime: formatPrayerTime(now, use24HourTime, FIXED_PRAYER_LOCATION.timeZone),
    displayDate: new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      timeZone: FIXED_PRAYER_LOCATION.timeZone,
    }).format(now),
    hijriDate: compactHijriDate(hijriDate),
    location: 'Lahore, PK',
    remainingDuration: formatWidgetRemainingDuration(remainingTime),
    remainingTime: formatWidgetRemaining(remainingTime),
    progressPercent: calculatePreviewProgress(now, current, next),
  };
}

function getLargeRows(data: WidgetPreviewData): {
  previous: WidgetPrayer;
  next: WidgetPrayer;
  afterNext: WidgetPrayer;
} {
  const currentIndex = data.prayers.indexOf(data.current);
  const nextIndex = data.prayers.indexOf(data.next);
  const safeCurrentIndex = currentIndex >= 0 ? currentIndex : 0;
  const safeNextIndex = nextIndex >= 0 ? nextIndex : safeCurrentIndex + 1;

  return {
    previous:
      data.prayers[(safeCurrentIndex - 1 + data.prayers.length) % data.prayers.length],
    next: data.prayers[safeNextIndex % data.prayers.length],
    afterNext: data.prayers[(safeNextIndex + 1) % data.prayers.length],
  };
}

function isWidgetPrayer(prayer: PrayerTime): prayer is WidgetPrayer {
  return OBLIGATORY_PRAYERS.includes(prayer.key as ObligatoryPrayerKey);
}

function compactHijriDate(hijriDate: string): string {
  return hijriDate.replace(' AH', '');
}

function formatWidgetRemaining(remainingTime: string): string {
  return `In ${formatWidgetRemainingDuration(remainingTime)}`;
}

function formatWidgetRemainingDuration(remainingTime: string): string {
  const [hours = 0, minutes = 0] = remainingTime
    .split(':')
    .map(value => Number.parseInt(value, 10));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function calculatePreviewProgress(
  now: Date,
  current: WidgetPrayer,
  next: WidgetPrayer,
): number {
  const currentMinutes = toTimeMinutes(current.time);
  let nextMinutes = toTimeMinutes(next.time);
  let nowMinutes = getLahoreMinutes(now);

  if (nextMinutes <= currentMinutes) {
    nextMinutes += 24 * 60;
  }

  if (nowMinutes < currentMinutes) {
    nowMinutes += 24 * 60;
  }

  const totalMinutes = nextMinutes - currentMinutes;

  if (totalMinutes <= 0) {
    return 0;
  }

  const elapsedMinutes = Math.min(
    Math.max(nowMinutes - currentMinutes, 0),
    totalMinutes,
  );

  return Math.round((elapsedMinutes / totalMinutes) * 100);
}

function getLahoreMinutes(date: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    hourCycle: 'h23',
    timeZone: FIXED_PRAYER_LOCATION.timeZone,
  }).formatToParts(date);
  const hour = Number(parts.find(part => part.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find(part => part.type === 'minute')?.value ?? 0);

  return hour * 60 + minute;
}

function toTimeMinutes(time: string): number {
  const [hour = 0, minute = 0] = time
    .split(':')
    .map(value => Number.parseInt(value, 10));

  return hour * 60 + minute;
}

const styles = StyleSheet.create({
  screenContent: {
    paddingBottom: 32,
  },
  topBar: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intro: {
    alignItems: 'center',
    gap: spacing.md,
  },
  section: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    letterSpacing: 2,
  },
  smallWidget: {
    overflow: 'hidden',
    borderRadius: 28,
    backgroundColor: colors.surfaceLowest,
    padding: 0,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 3,
  },
  softRingSmall: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 12,
    borderColor: '#eef3f0',
  },
  smallIconWrap: {
    position: 'absolute',
    top: 12,
    right: 10,
  },
  smallTopCopy: {
    marginTop: 28,
    marginLeft: 18,
    marginRight: 74,
    gap: 4,
  },
  smallCurrentName: {
    color: colors.onSurface,
    fontSize: 28,
    lineHeight: 33,
  },
  smallRemaining: {
    fontSize: 14,
    lineHeight: 18,
  },
  smallNext: {
    fontSize: 14,
    lineHeight: 18,
  },
  smallFooter: {
    marginTop: 'auto',
    marginHorizontal: 18,
    marginBottom: 18,
    gap: spacing.sm,
  },
  progressTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: '#eceae5',
    overflow: 'hidden',
  },
  progressFill: {
    width: '68%',
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  mediumWidget: {
    minHeight: 154,
    overflow: 'hidden',
    borderRadius: 28,
    backgroundColor: colors.surfaceLowest,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 3,
  },
  softRingMedium: {
    position: 'absolute',
    width: 136,
    height: 136,
    right: -34,
    bottom: -38,
    borderRadius: 68,
    backgroundColor: '#f0f4f2',
  },
  mediumTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  mediumTime: {
    fontSize: 36,
    lineHeight: 42,
  },
  mediumStatus: {
    fontSize: 16,
    lineHeight: 20,
  },
  mediumLocation: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  mediumTimeline: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  mediumInactivePrayer: {
    minWidth: 48,
    alignItems: 'center',
    gap: spacing.xs,
  },
  mediumActivePrayer: {
    minWidth: 56,
    alignItems: 'center',
    gap: spacing.xs,
  },
  mediumActiveIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryContainer,
  },
  mediumPrayerName: {
    fontSize: 12,
    lineHeight: 15,
  },
  largeWidget: {
    minHeight: 356,
    overflow: 'hidden',
    borderRadius: 30,
    backgroundColor: colors.surfaceLowest,
    padding: spacing.md,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 3,
  },
  softRingLarge: {
    position: 'absolute',
    top: -48,
    right: -44,
    width: 196,
    height: 196,
    borderRadius: 98,
    borderWidth: 5,
    borderColor: '#e8eeeb',
  },
  dottedRingLarge: {
    position: 'absolute',
    top: -64,
    right: 36,
    width: 176,
    height: 176,
    borderRadius: 88,
    borderWidth: 8,
    borderColor: '#e1ece5',
    opacity: 0.8,
  },
  largeHeader: {
    minHeight: 88,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  largeClockRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  largeDate: {
    fontSize: 17,
    lineHeight: 22,
  },
  largeTime: {
    fontSize: 38,
    lineHeight: 44,
  },
  moreButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainer,
  },
  largeRows: {
    gap: spacing.sm,
  },
  largeDefaultRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  largeRowName: {
    flex: 1,
  },
  largeInactiveName: {
    fontSize: 21,
    lineHeight: 26,
  },
  largeDefaultName: {
    fontSize: 21,
    lineHeight: 26,
  },
  largeRowTime: {
    fontSize: 17,
    lineHeight: 22,
  },
  largeCurrentRow: {
    minHeight: 76,
    overflow: 'hidden',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: '#f8faf8',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.md,
    paddingRight: spacing.md,
    gap: spacing.md,
  },
  currentAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 9,
    backgroundColor: colors.primary,
  },
  largeCurrentIcon: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeCurrentText: {
    flex: 1,
    gap: 2,
  },
  largeCurrentName: {
    fontSize: 26,
    lineHeight: 31,
  },
  largeCurrentRemaining: {
    fontSize: 15,
    lineHeight: 19,
  },
  largeCurrentTime: {
    fontSize: 21,
    lineHeight: 26,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 60,
    backgroundColor: colors.surfaceHigh,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
});
