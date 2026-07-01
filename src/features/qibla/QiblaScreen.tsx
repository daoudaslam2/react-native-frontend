import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppText } from '../../components/AppText';
import { Compass } from '../../components/Compass';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import { Surface } from '../../components/Surface';
import type { RootStackParamList } from '../../navigation/types';
import { prayerRepository } from '../../services/repositories/prayerRepository';
import { colors, radius, spacing } from '../../theme';

type QiblaNavigation = NativeStackNavigationProp<RootStackParamList, 'Qibla'>;

export function QiblaScreen(): React.JSX.Element {
  const navigation = useNavigation<QiblaNavigation>();
  const summary = prayerRepository.getSummary();

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

      <View style={styles.location}>
        <View style={styles.currentLocation}>
          <Icon name="location" size={18} color={colors.onSurfaceVariant} />
          <AppText variant="label" color="onSurfaceVariant" transform="uppercase">
            Fixed Location
          </AppText>
        </View>
        <AppText variant="title" weight="700">
          {summary.location}
        </AppText>
        <AppText variant="body" color="outline">
          {summary.distanceToMakkahKm.toLocaleString()} km to Makkah
        </AppText>
      </View>

      <Compass direction={summary.qiblaDirection} />

      <Surface style={styles.calibration} radiusSize="lg">
        <View style={styles.calibrationIcon}>
          <Icon name="rotate" color={colors.outline} />
        </View>
        <AppText variant="title" weight="700" align="center">
          Needs Calibration?
        </AppText>
        <AppText variant="body" color="onSurfaceVariant" align="center">
          Move your phone in a figure-8 motion to calibrate the compass for
          better accuracy.
        </AppText>
        <Pressable style={styles.calibrateButton}>
          <AppText variant="label" color="onPrimaryContainer">
            Calibrate Now
          </AppText>
        </Pressable>
      </Surface>
    </Screen>
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
  location: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  currentLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  calibration: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceLow,
  },
  calibrationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceHigh,
  },
  calibrateButton: {
    borderRadius: radius.full,
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
  },
  pressed: {
    opacity: 0.7,
  },
});
