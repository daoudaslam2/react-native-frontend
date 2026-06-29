import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { colors, radius, spacing } from '../theme';
import { AppText } from './AppText';
import { Icon } from './Icon';

interface PrayerGradientCardProps {
  currentPrayer: string;
  remainingTime: string;
  nextPrayer: string;
  nextPrayerTime: string;
}

export function PrayerGradientCard({
  currentPrayer,
  remainingTime,
  nextPrayer,
  nextPrayerTime,
}: PrayerGradientCardProps): React.JSX.Element {
  return (
    <View style={styles.card}>
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 360 320" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="hero" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#ffffff" stopOpacity="1" />
            <Stop offset="1" stopColor="#edf8f1" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect width="360" height="320" rx="32" fill="url(#hero)" />
      </Svg>
      <View style={styles.currentBadge}>
        <AppText variant="labelSmall" color="primary" transform="uppercase">
          Current
        </AppText>
      </View>
      <AppText variant="display" color="onSurface" align="center">
        {currentPrayer}
      </AppText>
      <View style={styles.clock}>
        <View style={styles.outerRing} />
        <View style={styles.clockInner}>
          <AppText variant="title" color="onSurfaceVariant">
            Ends in
          </AppText>
          <AppText variant="headline" color="primary" weight="700">
            {remainingTime}
          </AppText>
        </View>
      </View>
      <View style={styles.nextRow}>
        <Icon name="mosque" color={colors.secondary} filled />
        <AppText variant="body" color="onSurfaceVariant">
          Next: {nextPrayer} at {nextPrayerTime}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderRadius: 32,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceLowest,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 32,
    elevation: 3,
  },
  currentBadge: {
    borderRadius: radius.full,
    backgroundColor: 'rgba(0, 106, 57, 0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  clock: {
    width: 196,
    height: 196,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  outerRing: {
    position: 'absolute',
    width: 196,
    height: 196,
    borderRadius: 98,
    borderWidth: 12,
    borderColor: 'rgba(0, 106, 57, 0.1)',
    backgroundColor: 'rgba(172, 237, 218, 0.18)',
  },
  clockInner: {
    width: 168,
    height: 168,
    borderRadius: 84,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceLowest,
    gap: spacing.xs,
  },
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
