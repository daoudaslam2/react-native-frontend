import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppText } from '../../components/AppText';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';
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
import { colors, radius, spacing } from '../../theme';
import { AuthTextField } from './AuthTextField';
import { useAuthStore } from './authStore';
import { useSettingsStore } from '../settings/settingsStore';

type LocationSetupNavigation = NativeStackNavigationProp<
  RootStackParamList,
  'LocationSetup'
>;

export function LocationSetupScreen(): React.JSX.Element {
  const navigation = useNavigation<LocationSetupNavigation>();
  const displayName = useAuthStore(state => state.displayName);
  const onboardingCompleted = useAuthStore(
    state => state.onboardingCompleted,
  );
  const completeOnboarding = useAuthStore(state => state.completeOnboarding);
  const setPrayerLocation = useSettingsStore(state => state.setPrayerLocation);
  const currentPrayerLocation = useSettingsStore(state => state.location);
  const initialPrayerLocation = onboardingCompleted
    ? currentPrayerLocation
    : null;
  const isEditingLocation = initialPrayerLocation !== null;
  const [name, setName] = React.useState(displayName);
  const [latitude, setLatitude] = React.useState(
    initialPrayerLocation ? initialPrayerLocation.latitude.toFixed(6) : '',
  );
  const [longitude, setLongitude] = React.useState(
    initialPrayerLocation ? initialPrayerLocation.longitude.toFixed(6) : '',
  );
  const [selectedLocation, setSelectedLocation] =
    React.useState<PrayerLocation | null>(initialPrayerLocation);
  const [error, setError] = React.useState<string | null>(null);
  const [isLocating, setIsLocating] = React.useState(false);

  const handleUseCurrentLocation = async () => {
    setError(null);
    setIsLocating(true);

    try {
      const coordinates = await getPermissionAndLocation();
      const location = createDevicePrayerLocation(coordinates);

      setSelectedLocation(location);
      setLatitude(location.latitude.toFixed(6));
      setLongitude(location.longitude.toFixed(6));
    } catch {
      setError(
        'Location permission was not granted. Enter coordinates manually to continue.',
      );
    } finally {
      setIsLocating(false);
    }
  };

  const handleUseManualCoordinates = (): PrayerLocation | null => {
    const parsedLatitude = normalizeLatitude(latitude);
    const parsedLongitude = normalizeLongitude(longitude);

    if (parsedLatitude === null || parsedLongitude === null) {
      setError('Enter valid latitude and longitude values.');
      return null;
    }

    const location = createManualPrayerLocation({
      latitude: parsedLatitude,
      longitude: parsedLongitude,
    });

    setSelectedLocation(location);
    setError(null);
    return location;
  };

  const handleContinue = () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Enter your name to continue.');
      return;
    }

    const location = selectedLocation ?? handleUseManualCoordinates();

    if (!location) {
      return;
    }

    setPrayerLocation(location);
    completeOnboarding({
      displayName: trimmedName,
      prayerLocation: location,
    });

    if (isEditingLocation && navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboard}>
      <Screen contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {isEditingLocation ? (
          <View style={styles.topBar}>
            <Pressable
              accessibilityLabel="Go back"
              accessibilityRole="button"
              onPress={() => navigation.goBack()}
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.pressed,
              ]}>
              <Icon name="arrowLeft" size={28} color={colors.primary} />
            </Pressable>
          </View>
        ) : null}

        <View style={styles.titleBlock}>
          <AppText variant="headline" weight="700">
            Set your prayer location
          </AppText>
          <AppText variant="body" color="onSurfaceVariant">
            Al-Salah calculates prayer times locally. Choose device location or
            enter coordinates manually.
          </AppText>
        </View>

        <AuthTextField
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          autoCapitalize="words"
        />

        <View style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <View style={styles.locationIcon}>
              <Icon name="location" color={colors.primary} />
            </View>
            <View style={styles.locationCopy}>
              <AppText variant="bodyLarge" weight="700">
                Use current location
              </AppText>
              <AppText variant="body" color="onSurfaceVariant">
                Used only to calculate prayer times and Qibla locally.
              </AppText>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={isLocating}
            onPress={handleUseCurrentLocation}
            style={({ pressed }) => [
              styles.outlineButton,
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
                }}
                placeholder="Latitude"
                keyboardType="numbers-and-punctuation"
              />
            </View>
            <View style={styles.coordinateField}>
              <AuthTextField
                label="Longitude"
                value={longitude}
                onChangeText={value => {
                  setLongitude(value);
                  setSelectedLocation(null);
                }}
                placeholder="Longitude"
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={handleUseManualCoordinates}
            style={({ pressed }) => [
              styles.manualButton,
              pressed && styles.pressed,
            ]}>
            <AppText variant="label" color="primary">
              Use Manual Coordinates
            </AppText>
          </Pressable>
          <AppText variant="label" color="onSurfaceVariant">
            If you enter coordinates manually, prayer times will not update
            automatically when your location changes. Update them later in
            Settings.
          </AppText>
        </View>

        {selectedLocation ? (
          <View style={styles.selectedLocation}>
            <Icon name="checkCircle" color={colors.primary} filled />
            <View style={styles.selectedText}>
              <AppText variant="label" color="primary">
                {selectedLocation.label}
              </AppText>
              <AppText variant="labelSmall" color="onSurfaceVariant">
                {formatCoordinatesLabel(selectedLocation)}
              </AppText>
            </View>
          </View>
        ) : null}

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
            pressed && styles.pressed,
          ]}>
          <AppText variant="label" color="onPrimaryContainer">
            Continue
          </AppText>
        </Pressable>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
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
  locationCard: {
    gap: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceLowest,
    padding: spacing.md,
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
    backgroundColor: colors.primarySoft,
  },
  locationCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  outlineButton: {
    minHeight: 48,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
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
  manualButton: {
    minHeight: 48,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  selectedLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    padding: spacing.md,
  },
  selectedText: {
    flex: 1,
    gap: 2,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryContainer,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
});
