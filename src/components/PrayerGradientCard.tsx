import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { radius, spacing, useAppTheme } from '../theme';
import { AppText } from './AppText';

interface PrayerGradientCardProps {
  currentPrayer: string;
  isPrayerActive: boolean;
  countdownLabel: string;
  remainingTime: string;
  nextPrayer: string;
  nextPrayerTime: string;
}

export function PrayerGradientCard({
  currentPrayer,
  isPrayerActive,
  countdownLabel,
  remainingTime,
  nextPrayer,
  nextPrayerTime,
}: PrayerGradientCardProps): React.JSX.Element {
  const { colors, resolvedTheme } = useAppTheme();
  const gradientStart = resolvedTheme === 'dark' ? colors.surfaceLow : '#ffffff';
  const gradientEnd =
    resolvedTheme === 'dark' ? colors.surfaceLowest : '#edf8f1';
  const ringFill =
    resolvedTheme === 'dark'
      ? colors.surfaceHigh
      : 'rgba(172, 237, 218, 0.18)';

  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceLowest }]}>
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 360 320" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="hero" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={gradientStart} stopOpacity="1" />
            <Stop offset="1" stopColor={gradientEnd} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect width="360" height="320" rx="32" fill="url(#hero)" />
      </Svg>
      <View style={[styles.currentBadge, { backgroundColor: colors.primarySoft }]}>
        <AppText variant="labelSmall" color="primary" transform="uppercase">
          {isPrayerActive ? 'Current' : 'Next'}
        </AppText>
      </View>
      <AppText variant="display" color="onSurface" align="center">
        {currentPrayer}
      </AppText>
      <View style={styles.clock}>
        <View
          style={[
            styles.outerRing,
            {
              borderColor: colors.primarySoft,
              backgroundColor: ringFill,
            },
          ]}
        />
        <View
          style={[
            styles.clockInner,
            { backgroundColor: colors.surfaceLowest },
          ]}>
          <AppText variant="title" color="onSurfaceVariant">
            {countdownLabel}
          </AppText>
          <AppText variant="headline" color="primary" weight="700">
            {remainingTime}
          </AppText>
        </View>
      </View>
      <View style={styles.nextRow}>
        <NextPrayerIcon size={24} color={colors.secondary} />
        <AppText
          variant="body"
          color="onSurfaceVariant"
          style={styles.nextText}>
          {isPrayerActive
            ? `Next: ${nextPrayer} at ${nextPrayerTime}`
            : `${nextPrayer} starts at ${nextPrayerTime}`}
        </AppText>
      </View>
    </View>
  );
}

function NextPrayerIcon({
  size,
  color,
}: {
  size: number;
  color: string;
}): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="64 39 150 120">
      <Path
        fill={color}
        d="M150.998367,151.925720 C150.995834,146.102081 151.087265,140.768280 150.967560,135.439209 C150.808838,128.373428 145.802292,123.161148 139.244537,123.030418 C132.472778,122.895416 127.223030,128.178513 127.026932,135.450150 C126.923660,139.279587 127.003181,143.113983 127.001930,146.946136 C127.000694,150.755981 127.001663,154.565826 127.001663,158.687378 C109.008926,158.687378 91.285255,158.687378 72.998337,158.687378 C72.998337,156.898453 72.998329,155.125702 72.998329,153.352966 C72.998322,132.026123 73.062569,110.698761 72.893379,89.373260 C72.877441,87.363953 71.829514,84.997215 70.507545,83.432907 C66.645622,78.863029 65.719307,74.381516 69.015205,69.287773 C71.776268,65.020607 75.229553,61.201347 79.027649,56.352215 C82.816452,61.262268 86.342186,65.218491 89.148537,69.632118 C92.263031,74.530388 91.278793,78.925507 87.572510,83.346695 C86.249359,84.925064 85.202065,87.236214 85.116005,89.259132 C84.819038,96.239388 85.001694,103.240051 85.001694,110.615379 C88.855453,110.615379 92.582710,110.615379 97.001068,110.615379 C97.001068,107.214058 96.919830,103.619003 97.017456,100.028824 C97.242661,91.746422 101.936226,87.214729 110.272156,87.206467 C129.432968,87.187477 148.593842,87.186981 167.754654,87.206718 C176.078598,87.215294 180.760620,91.758331 180.983536,100.055756 C181.076645,103.521523 180.999008,106.991867 180.999008,110.724884 C185.072876,110.724884 188.799103,110.724884 192.995224,110.724884 C192.995224,102.796516 193.088165,95.009964 192.898972,87.230278 C192.869247,86.008453 191.741104,84.650932 190.811401,83.641068 C186.404739,78.854408 185.669235,74.177277 189.302002,68.711227 C191.954697,64.719841 195.236557,61.146591 199.214096,56.164177 C203.239624,61.889599 207.170898,66.711426 210.199448,72.045769 C212.396790,75.916061 210.301971,79.627831 207.819183,83.080635 C206.421768,85.024002 205.140854,87.598648 205.120956,89.900261 C204.923874,112.708298 205.001633,135.518707 205.001633,158.664673 C187.055405,158.664673 169.331360,158.664673 150.998367,158.664673 C150.998367,156.618118 150.998367,154.517899 150.998367,151.925720 z"
      />
      <Path
        fill={color}
        d="M120.433029,51.435394 C126.662315,47.255146 132.601944,43.290771 139.239029,38.860874 C148.739990,45.573059 158.695999,52.122341 168.064957,59.424812 C172.935684,63.221230 174.751602,69.212303 174.961975,75.445129 C175.081985,79.000145 173.581436,81.158806 169.720596,81.157028 C149.274292,81.147598 128.827972,81.147751 108.381676,81.164894 C104.214172,81.168388 102.851517,78.787285 103.048042,75.049301 C103.479958,66.833664 107.372124,60.555809 113.946396,55.828640 C115.968048,54.374989 118.075302,53.040382 120.433029,51.435394 z"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderRadius: 32,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 32,
    elevation: 3,
  },
  currentBadge: {
    borderRadius: radius.full,
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
  },
  clockInner: {
    width: 168,
    height: 168,
    borderRadius: 84,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  nextRow: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  nextText: {
    lineHeight: 24,
  },
});
