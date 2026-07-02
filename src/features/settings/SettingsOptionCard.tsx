import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../components/AppText';
import { Icon } from '../../components/Icon';
import { radius, spacing, useThemeColors } from '../../theme';

interface SettingsOptionCardProps {
  label: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}

export function SettingsOptionCard({
  label,
  description,
  selected,
  onPress,
}: SettingsOptionCardProps): React.JSX.Element {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          borderColor: selected ? colors.primary : colors.outlineVariant,
          backgroundColor: selected ? colors.primarySoft : colors.surfaceLowest,
        },
        pressed && styles.pressed,
      ]}>
      <View style={styles.text}>
        <AppText variant="bodyLarge" weight="700">
          {label}
        </AppText>
        <AppText variant="body" color="onSurfaceVariant">
          {description}
        </AppText>
      </View>
      <View
        style={[
          styles.check,
          {
            borderColor: selected ? colors.primary : colors.outlineVariant,
            backgroundColor: selected ? colors.primary : colors.surfaceLowest,
          },
        ]}>
        {selected ? (
          <Icon name="check" size={18} color={colors.onPrimary} />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 76,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  text: {
    flex: 1,
    gap: spacing.xs,
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.99 }],
  },
});
