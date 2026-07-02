import React from 'react';
import { StyleSheet, View } from 'react-native';

import { radius, spacing, useThemeColors } from '../theme';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

interface MetricChipProps {
  icon: IconName;
  label: string;
  tone?: 'primary' | 'secondary' | 'neutral' | 'gold';
}

export function MetricChip({
  icon,
  label,
  tone = 'neutral',
}: MetricChipProps): React.JSX.Element {
  const colors = useThemeColors();
  const palette = getChipPalette(colors)[tone];

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <Icon name={icon} size={16} color={palette.foreground} filled />
      <AppText variant="labelSmall" style={{ color: palette.foreground }}>
        {label}
      </AppText>
    </View>
  );
}

function getChipPalette(colors: ReturnType<typeof useThemeColors>) {
  return {
  primary: {
    background: 'rgba(0, 106, 57, 0.1)',
    foreground: colors.primary,
  },
  secondary: {
    background: colors.secondaryContainer,
    foreground: colors.onSecondaryContainer,
  },
  neutral: {
    background: colors.surfaceContainer,
    foreground: colors.onSurfaceVariant,
  },
  gold: {
    background: colors.goldSoft,
    foreground: colors.inverseSurface,
  },
  };
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
