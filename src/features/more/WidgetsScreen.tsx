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
  seconds: string;
  displayDate: string;
  hijriDate: string;
  location: string;
  remainingTime: string;
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
    hijriDate: summary.hijriDate,
    remainingTime: summary.remainingTime,
    use24HourTime,
  });
  const previewWidth = Math.min(width - spacing.container * 2, 380);

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
        <View style={styles.installNote}>
          <Icon name="info" size={18} color={colors.primary} />
          <AppText variant="label" color="primary" style={styles.installText}>
            After rebuilding, open Android Widgets and search for Al-Salah.
          </AppText>
        </View>
      </View>

      <WidgetSection title="Small (2x2)">
        <SmallWidgetPreview data={previewData} size={Math.min(previewWidth, 280)} />
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
          size={74}
          color={colors.onPrimary}
          backgroundColor={colors.primaryContainer}
        />
      </View>
      <View style={styles.smallTopCopy}>
        <AppText variant="headline" weight="700" style={styles.widgetName}>
          {data.current.name}
        </AppText>
        <AppText variant="title" color="primary" weight="700">
          {data.remainingTime}
        </AppText>
      </View>
      <View style={styles.smallFooter}>
        <AppText variant="title" color="onSurfaceVariant" weight="700">
          Next: {data.next.name}
        </AppText>
        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
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
          <AppText variant="title" color="primary" weight="700">
            {data.next.name} is next
          </AppText>
        </View>
        <View style={styles.mediumLocation}>
          <AppText variant="bodyLarge" color="onSurfaceVariant" weight="700" align="right">
            {data.location}
          </AppText>
          <AppText variant="body" color="onSurfaceVariant" weight="700" align="right">
            {data.hijriDate}
          </AppText>
        </View>
      </View>
      <View style={styles.mediumTimeline}>
        {data.prayers.map(prayer =>
          prayer.key === data.next.key ? (
            <View key={prayer.key} style={styles.mediumActivePrayer}>
              <View style={styles.activeDot} />
              <View style={styles.mediumActiveIcon}>
                <PrayerIcon
                  name={prayer.key}
                  size={48}
                  color={colors.onPrimary}
                  backgroundColor="transparent"
                />
              </View>
              <AppText variant="bodyLarge" color="primary" weight="700">
                {prayer.name}
              </AppText>
            </View>
          ) : (
            <View key={prayer.key} style={styles.mediumInactivePrayer}>
              <PrayerIcon
                name={prayer.key}
                size={36}
                color={inactiveColor}
                backgroundColor="transparent"
              />
              <AppText variant="label" color="outline" weight="700">
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
          <AppText variant="title" color="onSurfaceVariant" weight="700">
            {data.displayDate}
          </AppText>
          <View style={styles.largeClockRow}>
            <AppText variant="display" weight="700" style={styles.largeTime}>
              {data.currentTime}
            </AppText>
            <AppText variant="headline" color="primary" weight="700">
              : {data.seconds}
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
              size={58}
              color={colors.onPrimary}
              backgroundColor={colors.primaryContainer}
            />
          </View>
          <View style={styles.largeCurrentText}>
            <AppText variant="headline" weight="700">
              {data.current.name}
            </AppText>
            <AppText variant="bodyLarge" color="primary" weight="700">
              {data.remainingTime}
            </AppText>
          </View>
          <AppText variant="title" weight="700">
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
        style={styles.largeRowName}>
        {prayer.name}
      </AppText>
      <AppText variant="bodyLarge" color="outline">
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
      <AppText variant="headlineMobile" style={styles.largeRowName}>
        {prayer.name}
      </AppText>
      <AppText variant="bodyLarge" color="onSurfaceVariant">
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
  hijriDate,
  remainingTime,
  use24HourTime,
}: {
  now: Date;
  prayers: WidgetPrayer[];
  currentPrayerName: string;
  nextPrayerName: string;
  hijriDate: string;
  remainingTime: string;
  use24HourTime: boolean;
}): WidgetPreviewData {
  const current =
    prayers.find(prayer => prayer.status === 'current') ??
    prayers.find(prayer => prayer.name === currentPrayerName) ??
    prayers[0];
  const next =
    prayers.find(prayer => prayer.status === 'next') ??
    prayers.find(prayer => prayer.name === nextPrayerName) ??
    prayers[(prayers.indexOf(current) + 1) % prayers.length];

  return {
    current,
    next,
    prayers,
    currentTime: formatPrayerTime(now, use24HourTime, FIXED_PRAYER_LOCATION.timeZone),
    seconds: now.getSeconds().toString().padStart(2, '0'),
    displayDate: new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      timeZone: FIXED_PRAYER_LOCATION.timeZone,
    }).format(now),
    hijriDate: compactHijriDate(hijriDate),
    location: 'Lahore, PK',
    remainingTime: formatWidgetRemaining(remainingTime),
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
  const [hours = 0, minutes = 0] = remainingTime
    .split(':')
    .map(value => Number.parseInt(value, 10));

  if (hours > 0) {
    return `In ${hours}h ${minutes}m`;
  }

  return `In ${minutes}m`;
}

const styles = StyleSheet.create({
  screenContent: {
    paddingBottom: 64,
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
  installNote: {
    maxWidth: 340,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primarySoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  installText: {
    flex: 1,
  },
  section: {
    alignItems: 'center',
    gap: spacing.md,
  },
  sectionTitle: {
    letterSpacing: 2,
  },
  smallWidget: {
    overflow: 'hidden',
    borderRadius: 36,
    backgroundColor: colors.surfaceLowest,
    padding: 34,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 3,
  },
  softRingSmall: {
    position: 'absolute',
    top: -24,
    right: -22,
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 18,
    borderColor: '#eef3f0',
  },
  smallIconWrap: {
    position: 'absolute',
    top: 42,
    right: 34,
  },
  smallTopCopy: {
    gap: 6,
  },
  widgetName: {
    color: colors.onSurface,
  },
  smallFooter: {
    marginTop: 'auto',
    gap: spacing.sm,
  },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#eceae5',
    overflow: 'hidden',
  },
  progressFill: {
    width: '68%',
    height: '100%',
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  mediumWidget: {
    minHeight: 186,
    overflow: 'hidden',
    borderRadius: 34,
    backgroundColor: colors.surfaceLowest,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 3,
  },
  softRingMedium: {
    position: 'absolute',
    width: 170,
    height: 170,
    right: -42,
    bottom: -46,
    borderRadius: 85,
    backgroundColor: '#f0f4f2',
  },
  mediumTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  mediumTime: {
    fontSize: 52,
    lineHeight: 58,
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
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginBottom: -6,
    zIndex: 1,
  },
  mediumActiveIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryContainer,
  },
  largeWidget: {
    minHeight: 424,
    overflow: 'hidden',
    borderRadius: 36,
    backgroundColor: colors.surfaceLowest,
    padding: spacing.lg,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 3,
  },
  softRingLarge: {
    position: 'absolute',
    top: -60,
    right: -54,
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 6,
    borderColor: '#e8eeeb',
  },
  dottedRingLarge: {
    position: 'absolute',
    top: -78,
    right: 44,
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 10,
    borderColor: '#e1ece5',
    opacity: 0.8,
  },
  largeHeader: {
    minHeight: 112,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  largeClockRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  largeTime: {
    fontSize: 52,
    lineHeight: 60,
  },
  moreButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainer,
  },
  largeRows: {
    gap: spacing.md,
  },
  largeDefaultRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  largeRowName: {
    flex: 1,
  },
  largeCurrentRow: {
    minHeight: 96,
    overflow: 'hidden',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: '#f8faf8',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.lg,
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
    width: 66,
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeCurrentText: {
    flex: 1,
    gap: 2,
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
