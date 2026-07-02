import React from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppText } from '../../components/AppText';
import { Icon } from '../../components/Icon';
import { MissingLocationState } from '../../components/MissingLocationState';
import { PrayerIcon } from '../../components/PrayerIcon';
import { Screen } from '../../components/Screen';
import { OBLIGATORY_PRAYERS } from '../../constants/prayers';
import type { PrayerLocation } from '../../constants/prayerSettings';
import { useNow } from '../../hooks/useNow';
import type { RootStackParamList } from '../../navigation/types';
import { prayerRepository } from '../../services/repositories/prayerRepository';
import {
  colors,
  darkColors,
  lightColors,
  radius,
  spacing,
} from '../../theme';
import type { ObligatoryPrayerKey, PrayerTime } from '../../types/prayer';
import { formatPrayerTime } from '../../utils/dateTime';
import { useSettingsStore } from '../settings/settingsStore';
import { getPrayerTrackingDate } from '../tracker/trackerRules';
import { requestWidgetPin, type WidgetPinSize } from './widgetPinning';

type WidgetsNavigation = NativeStackNavigationProp<
  RootStackParamList,
  'Widgets'
>;

type WidgetPrayer = PrayerTime & { key: ObligatoryPrayerKey };

interface WidgetPreviewData {
  current: WidgetPrayer;
  next: WidgetPrayer;
  prayers: WidgetPrayer[];
  isPrayerActive: boolean;
  currentTime: string;
  displayDate: string;
  hijriDate: string;
  location: string;
  countdownText: string;
  progressPercent: number;
}

interface WidgetPreviewPalette {
  surface: string;
  surfaceSoft: string;
  text: string;
  muted: string;
  inactive: string;
  track: string;
  ring: string;
  accent: string;
  accentContainer: string;
  onAccent: string;
  border: string;
  divider: string;
}

export function WidgetsScreen(): React.JSX.Element {
  const location = useSettingsStore(state => state.location);

  if (!location) {
    return <MissingLocationState />;
  }

  return <WidgetsContent location={location} />;
}

function WidgetsContent({
  location,
}: {
  location: PrayerLocation;
}): React.JSX.Element {
  const navigation = useNavigation<WidgetsNavigation>();
  const { width } = useWindowDimensions();
  const [pendingWidgetSize, setPendingWidgetSize] =
    React.useState<WidgetPinSize | null>(null);
  const now = useNow();
  const use24HourTime = useSettingsStore(state => state.use24HourTime);
  const calculationMethod = useSettingsStore(state => state.calculationMethod);
  const asrMethod = useSettingsStore(state => state.asrMethod);
  const ishaDeadlineMinutes = useSettingsStore(
    state => state.ishaDeadlineMinutes,
  );
  const useDarkWidgetTheme = useSettingsStore(
    state => state.useDarkWidgetTheme,
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
  const prayers = prayerRepository
    .getTodayPrayerTimes(queryOptions)
    .filter(isWidgetPrayer);
  const previewData = createPreviewData({
    now,
    prayers,
    currentPrayerName: summary.currentPrayer,
    nextPrayerName: summary.nextPrayer,
    nextPrayerTime: summary.nextPrayerTime,
    isPrayerActive: summary.isPrayerActive,
    countdownStartTime: summary.countdownStartTime,
    countdownEndTime: summary.countdownEndTime,
    hijriDate: summary.hijriDate,
    remainingTime: summary.remainingTime,
    use24HourTime,
    location,
  });
  const previewWidth = Math.min(width - spacing.container * 2, 330);
  const previewPalette = getWidgetPreviewPalette({ useDarkWidgetTheme });
  const handleAddWidget = React.useCallback(
    async (widgetSize: WidgetPinSize) => {
      setPendingWidgetSize(widgetSize);

      try {
        const result = await requestWidgetPin(widgetSize);

        if (!result.requested) {
          Alert.alert(
            'Widget pinning unavailable',
            'Open the Android widget picker and choose Al-Salah from the widget list.',
          );
        }
      } catch {
        Alert.alert(
          'Could not add widget',
          'Open the Android widget picker and choose Al-Salah from the widget list.',
        );
      } finally {
        setPendingWidgetSize(null);
      }
    },
    [],
  );

  return (
    <Screen contentContainerStyle={styles.screenContent}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <Icon name="arrowLeft" size={28} color={colors.primary} />
        </Pressable>
        <AppText variant="headlineMobile" weight="700" align="center">
          Widgets
        </AppText>
      </View>

      <View style={styles.intro}>
        <AppText variant="bodyLarge" color="onSurfaceVariant" align="center">
          Preview Android home screen widgets. Long press a widget preview to
          add it.
        </AppText>
      </View>

      <WidgetSection
        title="Compact (2x1)"
        isAdding={pendingWidgetSize === 'small'}
        onLongPress={() => handleAddWidget('small')}
      >
        <SmallWidgetPreview
          data={previewData}
          palette={previewPalette}
          width={Math.min(previewWidth, 200)}
        />
      </WidgetSection>

      <WidgetSection
        title="Medium (4x2)"
        isAdding={pendingWidgetSize === 'medium'}
        onLongPress={() => handleAddWidget('medium')}
      >
        <MediumWidgetPreview
          data={previewData}
          palette={previewPalette}
          width={previewWidth}
        />
      </WidgetSection>

      <WidgetSection
        title="Large (4x4)"
        isAdding={pendingWidgetSize === 'large'}
        onLongPress={() => handleAddWidget('large')}
      >
        <LargeWidgetPreview
          data={previewData}
          palette={previewPalette}
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
  isAdding,
  onLongPress,
}: {
  title: string;
  children: React.ReactNode;
  isAdding: boolean;
  onLongPress: () => void;
}): React.JSX.Element {
  return (
    <View style={styles.section}>
      <AppText
        variant="label"
        color="onSurfaceVariant"
        transform="uppercase"
        weight="700"
        align="center"
        style={styles.sectionTitle}
      >
        {title}
      </AppText>
      <Pressable
        accessibilityLabel={`Long press to add ${title} widget`}
        accessibilityRole="button"
        accessibilityState={{ busy: isAdding }}
        delayLongPress={350}
        disabled={isAdding}
        onLongPress={onLongPress}
        style={({ pressed }) => [
          styles.previewPressable,
          pressed && styles.previewPressed,
          isAdding && styles.previewDisabled,
        ]}
      >
        {children}
      </Pressable>
    </View>
  );
}

function SmallWidgetPreview({
  data,
  palette,
  width,
}: {
  data: WidgetPreviewData;
  palette: WidgetPreviewPalette;
  width: number;
}): React.JSX.Element {
  return (
    <View
      style={[
        styles.smallWidget,
        { backgroundColor: palette.surface, width, height: width * 0.5 },
      ]}
    >
      <View
        style={[styles.softRingSmall, { borderColor: palette.ring }]}
      />
      <View style={styles.smallIconWrap}>
        <PrayerIcon
          name={data.current.key}
          size={36}
          color={palette.onAccent}
          backgroundColor={palette.accentContainer}
        />
      </View>
      <View style={styles.smallTopCopy}>
        <AppText
          variant="headline"
          weight="700"
          style={[styles.smallCurrentName, { color: palette.text }]}
        >
          {data.current.name}
        </AppText>
        <AppText
          variant="bodyLarge"
          weight="700"
          style={[styles.smallRemaining, { color: palette.accent }]}
        >
          {data.countdownText}
        </AppText>
      </View>
      <View style={styles.smallFooter}>
        <AppText
          variant="body"
          weight="700"
          style={[styles.smallNext, { color: palette.muted }]}
        >
          {data.isPrayerActive
            ? `Next: ${data.next.name}`
            : `Starts: ${formatPrayerTime(data.next.time, true)}`}
        </AppText>
        <View style={[styles.progressTrack, { backgroundColor: palette.track }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: palette.accent,
                width: `${data.progressPercent}%`,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

function MediumWidgetPreview({
  data,
  palette,
  width,
}: {
  data: WidgetPreviewData;
  palette: WidgetPreviewPalette;
  width: number;
}): React.JSX.Element {
  return (
    <View
      style={[
        styles.mediumWidget,
        { backgroundColor: palette.surface, width },
      ]}
    >
      <View style={[styles.softRingMedium, { backgroundColor: palette.ring }]} />
      <View style={styles.mediumTop}>
        <View>
          <AppText
            variant="display"
            weight="700"
            style={[styles.mediumTime, { color: palette.text }]}
          >
            {data.currentTime}
          </AppText>
          <AppText
            variant="bodyLarge"
            weight="700"
            style={[styles.mediumStatus, { color: palette.accent }]}
          >
            {data.isPrayerActive
              ? `Next: ${data.next.name}`
              : data.countdownText}
          </AppText>
        </View>
        <View style={styles.mediumLocation}>
          <AppText
            variant="label"
            weight="700"
            align="right"
            style={{ color: palette.muted }}
          >
            {data.location}
          </AppText>
          <AppText
            variant="label"
            weight="700"
            align="right"
            style={{ color: palette.muted }}
          >
            {data.hijriDate}
          </AppText>
        </View>
      </View>
      <View style={styles.mediumTimeline}>
        {data.prayers.map(prayer =>
          prayer.key === data.current.key ? (
            <View key={prayer.key} style={styles.mediumActivePrayer}>
              <View
                style={[
                  styles.mediumActiveIcon,
                  { backgroundColor: palette.accentContainer },
                ]}
              >
                <PrayerIcon
                  name={prayer.key}
                  size={40}
                  color={palette.onAccent}
                  backgroundColor="transparent"
                />
              </View>
              <AppText
                variant="label"
                weight="700"
                style={[styles.mediumPrayerName, { color: palette.accent }]}
              >
                {prayer.name}
              </AppText>
            </View>
          ) : (
            <View key={prayer.key} style={styles.mediumInactivePrayer}>
              <PrayerIcon
                name={prayer.key}
                size={28}
                color={palette.inactive}
                backgroundColor="transparent"
              />
              <AppText
                variant="labelSmall"
                weight="700"
                style={[styles.mediumPrayerName, { color: palette.inactive }]}
              >
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
  palette,
  width,
  use24HourTime,
}: {
  data: WidgetPreviewData;
  palette: WidgetPreviewPalette;
  width: number;
  use24HourTime: boolean;
}): React.JSX.Element {
  const rows = getLargeRows(data);

  return (
    <View
      style={[
        styles.largeWidget,
        { backgroundColor: palette.surface, width },
      ]}
    >
      <View style={[styles.softRingLarge, { borderColor: palette.ring }]} />
      <View style={[styles.dottedRingLarge, { borderColor: palette.ring }]} />
      <View style={styles.largeHeader}>
        <View>
          <AppText
            variant="title"
            weight="700"
            style={[styles.largeDate, { color: palette.muted }]}
          >
            {data.displayDate}
          </AppText>
          <View style={styles.largeClockRow}>
            <AppText
              variant="display"
              weight="700"
              style={[styles.largeTime, { color: palette.text }]}
            >
              {data.currentTime}
            </AppText>
          </View>
        </View>
        <View style={[styles.moreButton, { backgroundColor: palette.track }]}>
          <AppText
            variant="headlineMobile"
            weight="700"
            style={{ color: palette.muted }}
          >
            ...
          </AppText>
        </View>
      </View>

      <View style={styles.largeRows}>
        <LargeInactiveRow
          palette={palette}
          prayer={rows.previous}
          use24HourTime={use24HourTime}
        />
        <View
          style={[
            styles.largeCurrentRow,
            {
              backgroundColor: palette.surfaceSoft,
              borderColor: palette.border,
            },
          ]}
        >
          <View
            style={[styles.currentAccent, { backgroundColor: palette.accent }]}
          />
          <View style={styles.largeCurrentIcon}>
            <PrayerIcon
              name={data.current.key}
              size={48}
              color={palette.onAccent}
              backgroundColor={palette.accentContainer}
            />
          </View>
          <View style={styles.largeCurrentText}>
            <AppText
              variant="headline"
              weight="700"
              style={[styles.largeCurrentName, { color: palette.text }]}
            >
              {data.current.name}
            </AppText>
            <AppText
              variant="bodyLarge"
              weight="700"
              style={[styles.largeCurrentRemaining, { color: palette.accent }]}
            >
              {data.countdownText}
            </AppText>
          </View>
          <AppText
            variant="title"
            weight="700"
            style={[styles.largeCurrentTime, { color: palette.text }]}
          >
            {formatPrayerTime(data.current.time, use24HourTime)}
          </AppText>
        </View>
        <LargeDefaultRow
          palette={palette}
          prayer={rows.next}
          use24HourTime={use24HourTime}
        />
        <View style={[styles.rowDivider, { backgroundColor: palette.divider }]} />
        <LargeDefaultRow
          palette={palette}
          prayer={rows.afterNext}
          use24HourTime={use24HourTime}
        />
      </View>
    </View>
  );
}

function LargeInactiveRow({
  palette,
  prayer,
  use24HourTime,
}: {
  palette: WidgetPreviewPalette;
  prayer: WidgetPrayer;
  use24HourTime: boolean;
}): React.JSX.Element {
  return (
    <View style={styles.largeDefaultRow}>
      <PrayerIcon
        name={prayer.key}
        size={42}
        color={palette.inactive}
        backgroundColor="transparent"
      />
      <AppText
        variant="headlineMobile"
        style={[
          styles.largeRowName,
          styles.largeInactiveName,
          { color: palette.inactive },
        ]}
      >
        {prayer.name}
      </AppText>
      <AppText
        variant="bodyLarge"
        style={[styles.largeRowTime, { color: palette.inactive }]}
      >
        {formatPrayerTime(prayer.time, use24HourTime)}
      </AppText>
    </View>
  );
}

function LargeDefaultRow({
  palette,
  prayer,
  use24HourTime,
}: {
  palette: WidgetPreviewPalette;
  prayer: WidgetPrayer;
  use24HourTime: boolean;
}): React.JSX.Element {
  return (
    <View style={styles.largeDefaultRow}>
      <PrayerIcon
        name={prayer.key}
        size={42}
        color={palette.muted}
        backgroundColor="transparent"
      />
      <AppText
        variant="headlineMobile"
        style={[
          styles.largeRowName,
          styles.largeDefaultName,
          { color: palette.text },
        ]}
      >
        {prayer.name}
      </AppText>
      <AppText
        variant="bodyLarge"
        style={[styles.largeRowTime, { color: palette.muted }]}
      >
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
  isPrayerActive,
  countdownStartTime,
  countdownEndTime,
  hijriDate,
  remainingTime,
  use24HourTime,
  location,
}: {
  now: Date;
  prayers: WidgetPrayer[];
  currentPrayerName: string;
  nextPrayerName: string;
  nextPrayerTime: string;
  isPrayerActive: boolean;
  countdownStartTime: string;
  countdownEndTime: string;
  hijriDate: string;
  remainingTime: string;
  use24HourTime: boolean;
  location: PrayerLocation;
}): WidgetPreviewData {
  const displayPrayerName = isPrayerActive ? currentPrayerName : nextPrayerName;
  const current =
    prayers.find(prayer =>
      isPrayerActive ? prayer.status === 'current' : prayer.status === 'next',
    ) ??
    prayers.find(prayer => prayer.name === displayPrayerName) ??
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
    isPrayerActive,
    currentTime: formatPrayerTime(
      now,
      use24HourTime,
      location.timeZone,
    ),
    displayDate: new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      timeZone: location.timeZone,
    }).format(now),
    hijriDate: compactHijriDate(hijriDate),
    location: location.label,
    countdownText: formatWidgetCountdown(remainingTime, isPrayerActive),
    progressPercent: calculatePreviewProgress(
      now,
      countdownStartTime,
      countdownEndTime,
      location.timeZone,
    ),
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
      data.prayers[
        (safeCurrentIndex - 1 + data.prayers.length) % data.prayers.length
      ],
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

function formatWidgetCountdown(
  remainingTime: string,
  isPrayerActive: boolean,
): string {
  const duration = formatWidgetRemainingDuration(remainingTime);

  return isPrayerActive ? `${duration} remaining` : `In ${duration}`;
}

function formatWidgetRemainingDuration(remainingTime: string): string {
  const [hours = 0, minutes = 0] = remainingTime
    .split(':')
    .map(value => Number.parseInt(value, 10));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes === 0) {
    return 'Less than a minute';
  }

  return `${minutes}m`;
}

function calculatePreviewProgress(
  now: Date,
  countdownStartTime: string,
  countdownEndTime: string,
  timeZone: string,
): number {
  const startMinutes = toTimeMinutes(countdownStartTime);
  let endMinutes = toTimeMinutes(countdownEndTime);
  let nowMinutes = getZonedMinutes(now, timeZone);

  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }

  if (nowMinutes < startMinutes) {
    nowMinutes += 24 * 60;
  }

  const totalMinutes = endMinutes - startMinutes;

  if (totalMinutes <= 0) {
    return 0;
  }

  const elapsedMinutes = Math.min(
    Math.max(nowMinutes - startMinutes, 0),
    totalMinutes,
  );

  return Math.round((elapsedMinutes / totalMinutes) * 100);
}

function getZonedMinutes(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    hourCycle: 'h23',
    timeZone,
  }).formatToParts(date);
  const hour = Number(parts.find(part => part.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find(part => part.type === 'minute')?.value ?? 0);

  return (hour === 24 ? 0 : hour) * 60 + minute;
}

function toTimeMinutes(time: string): number {
  const [hour = 0, minute = 0] = time
    .split(':')
    .map(value => Number.parseInt(value, 10));

  return hour * 60 + minute;
}

function getWidgetPreviewPalette({
  useDarkWidgetTheme,
}: {
  useDarkWidgetTheme: boolean;
}): WidgetPreviewPalette {
  if (useDarkWidgetTheme) {
    return {
      surface: darkColors.surfaceLowest,
      surfaceSoft: darkColors.surfaceLow,
      text: darkColors.onSurface,
      muted: darkColors.onSurfaceVariant,
      inactive: darkColors.outline,
      track: darkColors.surfaceHighest,
      ring: darkColors.surfaceContainer,
      accent: darkColors.primary,
      accentContainer: darkColors.primaryContainer,
      onAccent: darkColors.onPrimaryContainer,
      border: darkColors.outlineVariant,
      divider: darkColors.outlineVariant,
    };
  }

  return {
    surface: lightColors.surfaceLowest,
    surfaceSoft: lightColors.surfaceLow,
    text: lightColors.onSurface,
    muted: lightColors.onSurfaceVariant,
    inactive: lightColors.outline,
    track: lightColors.surfaceHigh,
    ring: lightColors.surfaceContainer,
    accent: lightColors.primary,
    accentContainer: lightColors.primaryContainer,
    onAccent: lightColors.onPrimary,
    border: lightColors.outlineVariant,
    divider: lightColors.surfaceHigh,
  };
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
    borderRadius: 24,
    backgroundColor: colors.surfaceLowest,
    padding: 0,
    shadowColor: colors.onSurface,
    shadowOpacity: 0.06,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 3,
  },
  softRingSmall: {
    position: 'absolute',
    top: -12,
    right: -12,
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 8,
    borderColor: colors.surfaceContainer,
  },
  smallIconWrap: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  smallTopCopy: {
    marginTop: 10,
    marginLeft: 14,
    marginRight: 56,
    gap: 0,
  },
  smallCurrentName: {
    color: colors.onSurface,
    fontSize: 23,
    lineHeight: 27,
  },
  smallRemaining: {
    fontSize: 12,
    lineHeight: 15,
  },
  smallNext: {
    fontSize: 13,
    lineHeight: 16,
  },
  smallFooter: {
    marginTop: 'auto',
    marginHorizontal: 14,
    marginBottom: 9,
    gap: 4,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceHigh,
    overflow: 'hidden',
  },
  progressFill: {
    width: '68%',
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  previewPressable: {
    borderRadius: 28,
  },
  previewPressed: {
    transform: [{ scale: 0.99 }],
  },
  previewDisabled: {
    opacity: 0.7,
  },
  mediumWidget: {
    minHeight: 154,
    overflow: 'hidden',
    borderRadius: 28,
    backgroundColor: colors.surfaceLowest,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
    shadowColor: colors.onSurface,
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
    backgroundColor: colors.surfaceContainer,
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
    shadowColor: colors.onSurface,
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
    borderColor: colors.surfaceContainer,
  },
  dottedRingLarge: {
    position: 'absolute',
    top: -64,
    right: 36,
    width: 176,
    height: 176,
    borderRadius: 88,
    borderWidth: 8,
    borderColor: colors.surfaceHigh,
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
    backgroundColor: colors.surfaceLow,
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
