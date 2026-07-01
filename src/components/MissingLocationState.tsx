import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { Screen } from './Screen';

type LocationNavigation = NativeStackNavigationProp<RootStackParamList>;

export function MissingLocationState(): React.JSX.Element {
  const navigation = useNavigation<LocationNavigation>();

  return (
    <Screen contentContainerStyle={styles.content}>
      <View style={styles.iconWrap}>
        <Icon name="location" size={30} color={colors.primary} filled />
      </View>
      <View style={styles.copy}>
        <AppText variant="headlineMobile" weight="700" align="center">
          Set your prayer location
        </AppText>
        <AppText variant="body" color="onSurfaceVariant" align="center">
          Choose device location or enter coordinates before Al-Salah can
          calculate prayer times.
        </AppText>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.navigate('LocationSetup')}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.pressed,
        ]}>
        <AppText variant="label" color="onPrimaryContainer">
          Set Location
        </AppText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  iconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  copy: {
    maxWidth: 300,
    gap: spacing.sm,
  },
  button: {
    minHeight: 52,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
  },
  pressed: {
    opacity: 0.75,
  },
});
