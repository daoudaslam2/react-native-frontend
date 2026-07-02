import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Vibration,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { AppText } from '../../components/AppText';
import { Compass } from '../../components/Compass';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import { Surface } from '../../components/Surface';
import {
  createDevicePrayerLocation,
  type PrayerLocation,
} from '../../constants/prayerSettings';
import type { RootStackParamList } from '../../navigation/types';
import { getPermissionAndLocation } from '../../services/location/locationService';
import {
  calculateDistanceToMakkahKm,
  calculateQiblaDirection,
  getQiblaInstruction,
  getRelativeQiblaDirection,
  getShortestAngleToQibla,
} from '../../services/qibla/qiblaDirection';
import { useCompassHeading } from '../../services/qibla/useCompassHeading';
import { radius, spacing, useThemeColors } from '../../theme';

type QiblaNavigation = NativeStackNavigationProp<RootStackParamList, 'Qibla'>;

interface LayoutSize {
  width: number;
  height: number;
}

interface Point {
  x: number;
  y: number;
}

export function QiblaScreen(): React.JSX.Element {
  const navigation = useNavigation<QiblaNavigation>();
  const colors = useThemeColors();
  const [location, setLocation] = React.useState<PrayerLocation | null>(null);
  const [isRequestingLocation, setIsRequestingLocation] = React.useState(true);
  const [locationError, setLocationError] = React.useState<string | null>(null);

  const requestLocation = React.useCallback(() => {
    setIsRequestingLocation(true);
    setLocationError(null);

    getPermissionAndLocation({ showBlockedAlert: false })
      .then(coordinates => {
        setLocation(createDevicePrayerLocation(coordinates));
      })
      .catch(() => {
        setLocation(null);
        setLocationError(
          'Location permission is required to find the Qibla direction. Enable location access and try again.',
        );
      })
      .finally(() => {
        setIsRequestingLocation(false);
      });
  }, []);

  React.useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return (
    <Screen contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Icon name="arrowLeft" size={28} color={colors.primary} />
        </Pressable>
        <AppText variant="headlineMobile" weight="700" align="center">
          Qibla
        </AppText>
      </View>

      {isRequestingLocation ? (
        <LocationState
          icon="location"
          title="Finding your location"
          message="Allow location access so Al-Salah can calculate the Qibla direction from where you are now."
          loading
        />
      ) : null}

      {!isRequestingLocation && locationError ? (
        <LocationState
          icon="info"
          title="Location permission needed"
          message={locationError}
          actionLabel="Try Again"
          onAction={requestLocation}
        />
      ) : null}

      {!isRequestingLocation && location ? (
        <QiblaFinder location={location} />
      ) : null}
    </Screen>
  );
}

function QiblaFinder({
  location,
}: {
  location: PrayerLocation;
}): React.JSX.Element {
  const colors = useThemeColors();
  const qiblaDirection = calculateQiblaDirection(location);
  const distanceToMakkahKm = calculateDistanceToMakkahKm(location);
  const compass = useCompassHeading(location);
  const relativeDirection = getRelativeQiblaDirection({
    qiblaDirection,
    heading: compass.heading,
  });
  const shortestAngle = getShortestAngleToQibla(relativeDirection);
  const isAligned = compass.heading !== null && shortestAngle <= 5;
  const pulseKey = useAlignmentPulseKey(isAligned);
  const [layoutSize, setLayoutSize] = React.useState<LayoutSize | null>(null);
  const [waveOrigin, setWaveOrigin] = React.useState<Point | null>(null);
  const instruction = getQiblaInstruction({
    relativeDirection,
    hasHeading: compass.heading !== null,
  });

  const handleFinderLayout = React.useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;

    setLayoutSize({ width, height });
  }, []);

  const handleCompassLayout = React.useCallback((event: LayoutChangeEvent) => {
    const { x, y, width, height } = event.nativeEvent.layout;

    setWaveOrigin({
      x: x + width / 2,
      y: y + height / 2,
    });
  }, []);

  return (
    <View style={styles.finderLayout} onLayout={handleFinderLayout}>
      <AlignmentWave
        layoutSize={layoutSize}
        origin={waveOrigin}
        pulseKey={pulseKey}
      />

      <View style={[styles.instruction, styles.foreground]}>
        <AppText variant="title" weight="700" align="center">
          {instruction}
        </AppText>
      </View>

      <View
        style={[styles.compassCenter, styles.foreground]}
        onLayout={handleCompassLayout}>
        <KaabaIcon size={36} />
        <Compass qiblaDirection={qiblaDirection} heading={compass.heading} />
      </View>

      <View style={styles.foreground}>
        <AppText variant="label" color="onSurfaceVariant" align="center">
          Keep the phone flat and rotate until the Qibla arrow points up.
        </AppText>
      </View>

      <View style={[styles.metrics, styles.foreground]}>
        <Metric label="Qibla" value={`${qiblaDirection}°`} />
        <Metric
          label="Heading"
          value={
            compass.heading === null
              ? compass.isStarting
                ? 'Starting'
                : '--'
              : `${Math.round(compass.heading)}°`
          }
        />
        <Metric
          label="Distance"
          value={`${distanceToMakkahKm.toLocaleString()} km`}
        />
      </View>

      {compass.error ? (
        <Surface
          style={[
            styles.sensorNotice,
            styles.foreground,
            { backgroundColor: colors.surfaceHigh },
          ]}
          radiusSize="lg">
          <Icon name="info" color={colors.outline} />
          <AppText variant="body" color="onSurfaceVariant" align="center">
            {compass.error}
          </AppText>
        </Surface>
      ) : null}
    </View>
  );
}

function useAlignmentPulseKey(isAligned: boolean): number {
  const wasAlignedRef = React.useRef(false);
  const [pulseKey, setPulseKey] = React.useState(0);

  React.useEffect(() => {
    if (isAligned && !wasAlignedRef.current) {
      Vibration.vibrate(90);
      setPulseKey(current => current + 1);
    }

    wasAlignedRef.current = isAligned;
  }, [isAligned]);

  return pulseKey;
}

function AlignmentWave({
  layoutSize,
  origin,
  pulseKey,
}: {
  layoutSize: LayoutSize | null;
  origin: Point | null;
  pulseKey: number;
}): React.JSX.Element | null {
  const colors = useThemeColors();
  const fillScale = useSharedValue(0);
  const clearScale = useSharedValue(0);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    if (!layoutSize || !origin || pulseKey === 0) {
      return;
    }

    setIsVisible(true);
    fillScale.value = 0;
    clearScale.value = 0;

    fillScale.value = withTiming(
      1,
      {
        duration: 620,
        easing: Easing.out(Easing.cubic),
      },
      finished => {
        if (!finished) {
          return;
        }

        clearScale.value = withTiming(
          1,
          {
            duration: 760,
            easing: Easing.out(Easing.cubic),
          },
          clearFinished => {
            if (!clearFinished) {
              return;
            }

            runOnJS(setIsVisible)(false);
          },
        );
      },
    );
  }, [clearScale, fillScale, layoutSize, origin, pulseKey]);

  const fillStyle = useAnimatedStyle(() => ({
    opacity: 0.6,
    transform: [{ scale: fillScale.value }],
  }));
  const clearStyle = useAnimatedStyle(() => ({
    transform: [{ scale: clearScale.value }],
  }));

  if (!layoutSize || !origin || !isVisible) {
    return null;
  }

  const diameter =
    Math.sqrt(layoutSize.width ** 2 + layoutSize.height ** 2) * 2.2;
  const circlePosition = {
    width: diameter,
    height: diameter,
    borderRadius: diameter / 2,
    left: origin.x - diameter / 2,
    top: origin.y - diameter / 2,
  };

  return (
    <View pointerEvents="none" style={styles.alignmentWaveLayer}>
      <Animated.View
        style={[
          styles.alignmentWaveCircle,
          { backgroundColor: colors.primary },
          circlePosition,
          fillStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.alignmentWaveCircle,
          { backgroundColor: colors.background },
          circlePosition,
          clearStyle,
        ]}
      />
    </View>
  );
}

function LocationState({
  icon,
  title,
  message,
  loading = false,
  actionLabel,
  onAction,
}: {
  icon: 'info' | 'location';
  title: string;
  message: string;
  loading?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}): React.JSX.Element {
  const colors = useThemeColors();

  return (
    <View style={styles.stateContainer}>
      <Surface style={styles.stateCard} radiusSize="lg">
        <View
          style={[
            styles.stateIcon,
            { backgroundColor: colors.primarySoft },
          ]}>
          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Icon name={icon} color={colors.primary} />
          )}
        </View>
        <View style={styles.stateCopy}>
          <AppText variant="title" weight="700" align="center">
            {title}
          </AppText>
          <AppText variant="body" color="onSurfaceVariant" align="center">
            {message}
          </AppText>
        </View>
        {actionLabel && onAction ? (
          <Pressable
            accessibilityRole="button"
            onPress={onAction}
            style={({ pressed }) => [
              styles.retryButton,
              { backgroundColor: colors.primary },
              pressed && styles.pressed,
            ]}>
            <AppText variant="label" color="onPrimary" weight="700">
              {actionLabel}
            </AppText>
          </Pressable>
        ) : null}
      </Surface>
    </View>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.JSX.Element {
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.metric,
        {
          borderColor: colors.surfaceVariant,
          backgroundColor: colors.surfaceLowest,
        },
      ]}>
      <AppText variant="labelSmall" color="onSurfaceVariant" align="center">
        {label}
      </AppText>
      <AppText variant="bodyLarge" weight="700" align="center">
        {value}
      </AppText>
    </View>
  );
}

function KaabaIcon({
  size,
}: {
  size: number;
}): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36">
      <Path d="M18 0L0 5v29l18 2l18-2V5z" fill="#000000" />
      <Path d="M18 36l18-2V5L18 0z" fill="#292F33" />
      <Path
        d="M22.454 14.507v3.407l4.229.612V15.22zm7 1.181v3.239l3.299.478v-3.161zM18 13.756v3.513l1.683.244V14.04zm18 3.036l-.539-.091v3.096l.539.078z"
        fill="#FFD983"
      />
      <Path
        d="M0 16.792v3.083l.539-.078v-3.096zm16.317-2.752v3.473L18 17.269v-3.513zm-13.07 2.204v3.161l3.299-.478v-3.239zm6.07-1.024v3.306l4.229-.612v-3.407z"
        fill="#FFAC33"
      />
      <Path
        d="M21.389 15.131v-.042c0-.421-.143-.763-.32-.763c-.177 0-.32.342-.32.763v.042c-.208.217-.355.621-.355 1.103c0 .513.162.949.393 1.152c.064.195.163.33.282.33s.218-.135.282-.33c.231-.203.393-.639.393-1.152c-.001-.482-.147-.886-.355-1.103zm6.999 1.069v-.042c0-.421-.143-.763-.32-.763c-.177 0-.32.342-.32.763v.042c-.208.217-.355.621-.355 1.103c0 .513.162.949.393 1.152c.064.195.163.33.282.33s.218-.135.282-.33c.231-.203.393-.639.393-1.152c0-.481-.147-.885-.355-1.103zm6.017 1.03v-.039c0-.393-.134-.712-.299-.712c-.165 0-.299.319-.299.712v.039c-.194.203-.331.58-.331 1.03c0 .479.151.886.367 1.076c.059.182.152.308.263.308s.203-.126.263-.308c.215-.189.367-.597.367-1.076c0-.45-.136-.827-.331-1.03z"
        fill="#FFD983"
      />
      <Path
        d="M14.611 15.131v-.042c0-.421.143-.763.32-.763s.32.342.32.763v.042c.208.217.355.621.355 1.103c0 .513-.162.949-.393 1.152c-.064.195-.163.33-.282.33s-.218-.135-.282-.33c-.231-.203-.393-.639-.393-1.152c.001-.482.147-.886.355-1.103zM7.612 16.2v-.042c0-.421.143-.763.32-.763s.32.342.32.763v.042c.208.217.355.621.355 1.103c0 .513-.162.949-.393 1.152c-.064.195-.163.33-.282.33s-.218-.135-.282-.33c-.231-.203-.393-.639-.393-1.152c0-.481.147-.885.355-1.103zm-6.017 1.03v-.039c0-.393.134-.712.299-.712s.299.319.299.712v.039c.194.203.331.58.331 1.03c0 .479-.151.886-.367 1.076c-.059.182-.152.308-.263.308s-.204-.127-.264-.308c-.215-.189-.367-.597-.367-1.076c.001-.45.137-.827.332-1.03zM0 11.146v3.5l18-3.268V7.614z"
        fill="#FFAC33"
      />
      <Path d="M18 7.614v3.764l18 3.268v-3.5z" fill="#FFD983" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    gap: spacing.lg,
  },
  topBar: {
    position: 'relative',
    zIndex: 2,
    elevation: 2,
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
  stateContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  stateCard: {
    alignItems: 'center',
    gap: spacing.md,
  },
  stateIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateCopy: {
    gap: spacing.xs,
  },
  retryButton: {
    minHeight: 48,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  finderLayout: {
    flex: 1,
    gap: spacing.md,
    position: 'relative',
    overflow: 'visible',
  },
  foreground: {
    position: 'relative',
    zIndex: 1,
  },
  alignmentWaveLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 0,
    overflow: 'visible',
  },
  alignmentWaveCircle: {
    position: 'absolute',
  },
  instruction: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  compassCenter: {
    flex: 1,
    minHeight: 390,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  metrics: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metric: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
  },
  sensorNotice: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.7,
  },
});
