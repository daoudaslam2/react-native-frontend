import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

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
import { colors, radius, spacing } from '../../theme';

type QiblaNavigation = NativeStackNavigationProp<RootStackParamList, 'Qibla'>;

export function QiblaScreen(): React.JSX.Element {
  const navigation = useNavigation<QiblaNavigation>();
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
  const qiblaDirection = calculateQiblaDirection(location);
  const distanceToMakkahKm = calculateDistanceToMakkahKm(location);
  const compass = useCompassHeading(location);
  const relativeDirection = getRelativeQiblaDirection({
    qiblaDirection,
    heading: compass.heading,
  });
  const shortestAngle = getShortestAngleToQibla(relativeDirection);
  const isAligned = compass.heading !== null && shortestAngle <= 5;
  const instruction = getQiblaInstruction({
    relativeDirection,
    hasHeading: compass.heading !== null,
  });

  return (
    <>
      <View style={styles.compassCenter}>
        <Compass qiblaDirection={qiblaDirection} heading={compass.heading} />
      </View>

      <Surface style={styles.finderCard} radiusSize="lg">
        <View style={styles.finderHeader}>
          <View style={[styles.finderIcon, isAligned && styles.finderIconAligned]}>
            <Icon
              name={isAligned ? 'check' : 'compass'}
              color={isAligned ? colors.onPrimary : colors.primary}
            />
          </View>
          <View style={styles.finderCopy}>
            <AppText variant="title" weight="700">
              {instruction}
            </AppText>
            <AppText variant="body" color="onSurfaceVariant">
              Keep the phone flat and rotate until the Qibla arrow points up.
            </AppText>
          </View>
        </View>

        <View style={styles.metrics}>
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
      </Surface>

      {compass.error ? (
        <Surface style={styles.sensorNotice} radiusSize="lg">
          <Icon name="info" color={colors.outline} />
          <AppText variant="body" color="onSurfaceVariant" align="center">
            {compass.error}
          </AppText>
        </Surface>
      ) : null}
    </>
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
  return (
    <View style={styles.stateContainer}>
      <Surface style={styles.stateCard} radiusSize="lg">
        <View style={styles.stateIcon}>
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
  return (
    <View style={styles.metric}>
      <AppText variant="labelSmall" color="onSurfaceVariant" align="center">
        {label}
      </AppText>
      <AppText variant="bodyLarge" weight="700" align="center">
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    gap: spacing.xl,
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
    backgroundColor: colors.primarySoft,
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
    backgroundColor: colors.primary,
  },
  compassCenter: {
    flex: 1,
    minHeight: 360,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finderCard: {
    width: '100%',
    gap: spacing.md,
  },
  finderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  finderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  finderIconAligned: {
    backgroundColor: colors.primary,
  },
  finderCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  metrics: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metric: {
    flex: 1,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceLow,
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  sensorNotice: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceHigh,
  },
  pressed: {
    opacity: 0.7,
  },
});
