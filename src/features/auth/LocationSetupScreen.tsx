import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppText } from '../../components/AppText';
import { Icon } from '../../components/Icon';
import { KeyboardAvoidingScreen } from '../../components/KeyboardAvoidingScreen';
import {
  createDevicePrayerLocation,
  createManualPrayerLocation,
  formatCoordinatesLabel,
  normalizeLatitude,
  normalizeLongitude,
  type PrayerLocation,
} from '../../constants/prayerSettings';
import type { RootStackParamList } from '../../navigation/types';
import { getPermissionAndLocation } from '../../services/location/locationService';
import { radius, spacing, useThemeColors } from '../../theme';
import { AuthTextField } from './AuthTextField';
import { useAuthStore } from './authStore';
import { useSettingsStore } from '../settings/settingsStore';

type LocationSetupNavigation = NativeStackNavigationProp<
  RootStackParamList,
  'LocationSetup'
>;

type LocationMode = 'device' | 'manual';

interface LocationSetupFieldErrors {
  name?: string;
  deviceLocation?: string;
  latitude?: string;
  longitude?: string;
}

export function LocationSetupScreen(): React.JSX.Element {
  const navigation = useNavigation<LocationSetupNavigation>();
  const colors = useThemeColors();
  const persistedDisplayName = useAuthStore(state => state.displayName);
  const pendingDisplayName = useAuthStore(
    state => state.pendingSession?.displayName ?? '',
  );
  const onboardingCompleted = useAuthStore(
    state => state.onboardingCompleted,
  );
  const completeOnboarding = useAuthStore(state => state.completeOnboarding);
  const updateAuthPrayerLocation = useAuthStore(
    state => state.updatePrayerLocation,
  );
  const setPrayerLocation = useSettingsStore(state => state.setPrayerLocation);
  const currentPrayerLocation = useSettingsStore(state => state.location);
  const initialPrayerLocation = onboardingCompleted
    ? currentPrayerLocation
    : null;
  const isEditingLocation = initialPrayerLocation !== null;
  const displayName = pendingDisplayName || persistedDisplayName;
  const [name, setName] = React.useState(displayName);
  const [latitude, setLatitude] = React.useState(
    initialPrayerLocation ? initialPrayerLocation.latitude.toFixed(6) : '',
  );
  const [longitude, setLongitude] = React.useState(
    initialPrayerLocation ? initialPrayerLocation.longitude.toFixed(6) : '',
  );
  const [locationMode, setLocationMode] = React.useState<LocationMode>(
    initialPrayerLocation?.source === 'manual' ? 'manual' : 'device',
  );
  const [selectedLocation, setSelectedLocation] =
    React.useState<PrayerLocation | null>(
      initialPrayerLocation?.source === 'device' ? initialPrayerLocation : null,
    );
  const [fieldErrors, setFieldErrors] =
    React.useState<LocationSetupFieldErrors>({});
  const [error, setError] = React.useState<string | null>(null);
  const [isLocating, setIsLocating] = React.useState(false);

  const clearFieldError = (field: keyof LocationSetupFieldErrors) => {
    setFieldErrors(current => ({
      ...current,
      [field]: undefined,
    }));
  };

  const handleUseCurrentLocation = async () => {
    setError(null);
    clearFieldError('deviceLocation');
    setIsLocating(true);

    try {
      const coordinates = await getPermissionAndLocation();
      const location = createDevicePrayerLocation(coordinates);

      setSelectedLocation(location);
      setLocationMode('device');
      setLatitude(location.latitude.toFixed(6));
      setLongitude(location.longitude.toFixed(6));
      setFieldErrors(current => ({
        ...current,
        deviceLocation: undefined,
        latitude: undefined,
        longitude: undefined,
      }));
    } catch {
      setError(
        'Location permission was not granted. Enter coordinates manually to continue.',
      );
    } finally {
      setIsLocating(false);
    }
  };

  const handleUseManualCoordinates = (): PrayerLocation | null => {
    setError(null);

    const nextFieldErrors = validateManualCoordinates(latitude, longitude);

    setFieldErrors(current => ({
      ...current,
      latitude: nextFieldErrors.latitude,
      longitude: nextFieldErrors.longitude,
    }));

    if (nextFieldErrors.latitude || nextFieldErrors.longitude) {
      return null;
    }

    const parsedLatitude = normalizeLatitude(latitude);
    const parsedLongitude = normalizeLongitude(longitude);

    if (parsedLatitude === null || parsedLongitude === null) {
      return null;
    }

    const location = createManualPrayerLocation({
      latitude: parsedLatitude,
      longitude: parsedLongitude,
    });

    setSelectedLocation(null);
    setFieldErrors(current => ({
      ...current,
      latitude: undefined,
      longitude: undefined,
    }));
    setError(null);
    return location;
  };

  const handleLocationModeChange = (mode: LocationMode) => {
    setLocationMode(mode);
    setError(null);
    setFieldErrors(current => ({
      ...current,
      deviceLocation: undefined,
      latitude: undefined,
      longitude: undefined,
    }));
  };

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const handleContinue = () => {
    setError(null);

    const trimmedName = name.trim();
    const nextFieldErrors: LocationSetupFieldErrors = {};

    if (!isEditingLocation && !trimmedName) {
      nextFieldErrors.name = 'Enter your name to continue.';
    }

    const location =
      locationMode === 'device' ? selectedLocation : handleUseManualCoordinates();

    if (locationMode === 'device' && !selectedLocation) {
      nextFieldErrors.deviceLocation = 'Get your current location to continue.';
    }

    if (!location || nextFieldErrors.name) {
      setFieldErrors(current => ({
        ...current,
        ...nextFieldErrors,
      }));
      return;
    }

    setPrayerLocation(location);

    if (isEditingLocation) {
      updateAuthPrayerLocation(location);

      if (navigation.canGoBack()) {
        navigation.goBack();
        return;
      }

      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
      return;
    }

    completeOnboarding({
      displayName: trimmedName,
      prayerLocation: location,
    });

    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  return (
    <KeyboardAvoidingScreen contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          onPress={handleGoBack}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}>
          <Icon name="arrowLeft" size={28} color={colors.primary} />
        </Pressable>
      </View>

      <View style={styles.titleBlock}>
        <AppText variant="headline" weight="700">
          Set your prayer location
        </AppText>
        <AppText variant="body" color="onSurfaceVariant">
          Al-Salah calculates prayer times locally. Choose device location or
          enter coordinates manually.
        </AppText>
      </View>

      {!isEditingLocation ? (
        <AuthTextField
          label="Name"
          value={name}
          onChangeText={value => {
            setName(value);
            clearFieldError('name');
          }}
          placeholder="Your name"
          autoCapitalize="words"
          error={fieldErrors.name}
        />
      ) : null}

      <View
        style={[
          styles.modeTabs,
          { backgroundColor: colors.surfaceContainer },
        ]}>
        <LocationModeTab
          icon="location"
          label="Current"
          active={locationMode === 'device'}
          onPress={() => handleLocationModeChange('device')}
        />
        <LocationModeTab
          icon="editList"
          label="Manual"
          active={locationMode === 'manual'}
          onPress={() => handleLocationModeChange('manual')}
        />
      </View>

      {locationMode === 'device' ? (
        <View style={styles.locationModeSection}>
          <View
            style={[
              styles.locationCard,
              { backgroundColor: colors.surfaceLowest },
              fieldErrors.deviceLocation && styles.cardError,
              fieldErrors.deviceLocation && { borderColor: colors.error },
            ]}>
            <View style={styles.locationHeader}>
              <View
                style={[
                  styles.locationIcon,
                  { backgroundColor: colors.primarySoft },
                ]}>
                <Icon name="location" color={colors.primary} />
              </View>
              <View style={styles.locationCopy}>
                <View style={styles.cardTitleLine}>
                  <AppText variant="bodyLarge" weight="700">
                    Use current location
                  </AppText>
                  <View
                    style={[
                      styles.recommendedBadge,
                      { backgroundColor: colors.primarySoft },
                    ]}>
                    <Icon
                      name="checkCircle"
                      size={14}
                      color={colors.primary}
                    />
                    <AppText variant="labelSmall" color="primary" weight="700">
                      Recommended
                    </AppText>
                  </View>
                </View>
                <AppText variant="body" color="onSurfaceVariant">
                  Used only to calculate prayer times and Qibla locally.
                </AppText>
              </View>
            </View>

            {selectedLocation ? (
              <View
                style={[
                  styles.detectedLocation,
                  { backgroundColor: colors.primarySoft },
                ]}>
                <Icon name="checkCircle" size={20} color={colors.primary} />
                <View style={styles.detectedText}>
                  <AppText variant="label" color="primary" weight="700">
                    Location detected
                  </AppText>
                  <AppText variant="labelSmall" color="onSurfaceVariant">
                    {formatCoordinatesLabel(selectedLocation)}
                  </AppText>
                </View>
              </View>
            ) : null}

            <Pressable
              accessibilityRole="button"
              disabled={isLocating}
              onPress={handleUseCurrentLocation}
              style={({ pressed }) => [
                styles.outlineButton,
                { borderColor: colors.primary },
                pressed && styles.pressed,
                isLocating && styles.disabledButton,
              ]}>
              {isLocating ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <AppText variant="label" color="primary">
                  Get Location Permission
                </AppText>
              )}
            </Pressable>
          </View>
          {fieldErrors.deviceLocation ? (
            <AppText variant="labelSmall" color="error">
              {fieldErrors.deviceLocation}
            </AppText>
          ) : null}
        </View>
      ) : (
        <View style={styles.manualSection}>
          <AppText variant="bodyLarge" weight="700">
            Enter coordinates manually
          </AppText>
          <View style={styles.coordinateGrid}>
            <View style={styles.coordinateField}>
              <AuthTextField
                label="Latitude"
                value={latitude}
                onChangeText={value => {
                  setLatitude(value);
                  setSelectedLocation(null);
                  clearFieldError('latitude');
                }}
                placeholder="Latitude"
                keyboardType="numbers-and-punctuation"
                error={fieldErrors.latitude}
              />
            </View>
            <View style={styles.coordinateField}>
              <AuthTextField
                label="Longitude"
                value={longitude}
                onChangeText={value => {
                  setLongitude(value);
                  setSelectedLocation(null);
                  clearFieldError('longitude');
                }}
                placeholder="Longitude"
                keyboardType="numbers-and-punctuation"
                error={fieldErrors.longitude}
              />
            </View>
          </View>
          <View
            style={[
              styles.warningBox,
              { backgroundColor: colors.surfaceLow },
            ]}>
            <Icon name="info" size={20} color={colors.onSurfaceVariant} />
            <AppText
              variant="label"
              color="onSurfaceVariant"
              style={styles.warningText}>
              If you enter coordinates manually, prayer times will not update
              automatically when your location changes. Update them later in
              Settings. If coordinates are wrong, prayer times and Qibla may be
              inaccurate.
            </AppText>
          </View>
        </View>
      )}

      {error ? (
        <AppText variant="label" color="error">
          {error}
        </AppText>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={handleContinue}
        style={({ pressed }) => [
          styles.primaryButton,
          { backgroundColor: colors.primaryContainer },
          pressed && styles.pressed,
        ]}>
        <AppText variant="label" color="onPrimaryContainer" weight="700">
          {isEditingLocation ? 'Update Location' : 'Continue'}
        </AppText>
      </Pressable>
    </KeyboardAvoidingScreen>
  );
}

function LocationModeTab({
  icon,
  label,
  active,
  onPress,
}: {
  icon: 'location' | 'editList';
  label: string;
  active: boolean;
  onPress: () => void;
}): React.JSX.Element {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.modeTab,
        active && { backgroundColor: colors.primaryContainer },
        pressed && styles.pressed,
      ]}>
      <Icon
        name={icon}
        size={20}
        color={active ? colors.onPrimaryContainer : colors.onSurfaceVariant}
      />
      <View style={styles.modeTabText}>
        <AppText
          variant="label"
          color={active ? 'onPrimaryContainer' : 'onSurfaceVariant'}
          weight="700">
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

function validateManualCoordinates(
  latitude: string,
  longitude: string,
): Pick<LocationSetupFieldErrors, 'latitude' | 'longitude'> {
  const errors: Pick<LocationSetupFieldErrors, 'latitude' | 'longitude'> = {};

  if (!latitude.trim()) {
    errors.latitude = 'Enter latitude.';
  } else if (normalizeLatitude(latitude) === null) {
    errors.latitude = 'Latitude must be between -90 and 90.';
  }

  if (!longitude.trim()) {
    errors.longitude = 'Enter longitude.';
  } else if (normalizeLongitude(longitude) === null) {
    errors.longitude = 'Longitude must be between -180 and 180.';
  }

  return errors;
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    gap: spacing.lg,
  },
  topBar: {
    minHeight: 44,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    gap: spacing.sm,
  },
  modeTabs: {
    minHeight: 56,
    borderRadius: radius.xl,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.xs,
  },
  modeTab: {
    flex: 1,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  modeTabText: {
    alignItems: 'flex-start',
    gap: 2,
  },
  locationModeSection: {
    gap: spacing.xs,
  },
  locationCard: {
    gap: spacing.md,
    borderRadius: radius.xl,
    padding: spacing.md,
  },
  cardError: {
    borderWidth: 1,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  locationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  cardTitleLine: {
    gap: spacing.xs,
  },
  recommendedBadge: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  detectedLocation: {
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  detectedText: {
    flex: 1,
    gap: 2,
  },
  outlineButton: {
    minHeight: 48,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  disabledButton: {
    opacity: 0.7,
  },
  manualSection: {
    gap: spacing.md,
  },
  coordinateGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  coordinateField: {
    flex: 1,
  },
  warningBox: {
    borderRadius: radius.lg,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  warningText: {
    flex: 1,
  },
  primaryButton: {
    minHeight: 56,
    marginTop: 'auto',
    marginBottom: spacing.lg,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
});
