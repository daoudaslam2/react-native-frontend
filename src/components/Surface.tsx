import React from 'react';
import { StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';

import { radius, spacing, useThemeColors } from '../theme';

interface SurfaceProps extends ViewProps {
  padded?: boolean;
  elevated?: boolean;
  radiusSize?: keyof typeof radius;
}

export function Surface({
  padded = true,
  elevated = true,
  radiusSize = 'xl',
  style,
  children,
  ...rest
}: SurfaceProps): React.JSX.Element {
  const colors = useThemeColors();

  return (
    <View
      {...rest}
      style={[
        styles.surface,
        {
          backgroundColor: colors.surfaceLowest,
          borderColor: colors.surfaceVariant,
        },
        padded && styles.padded,
        elevated && styles.elevated,
        { borderRadius: radius[radiusSize] },
        style,
      ]}>
      {children}
    </View>
  );
}

const shadow: ViewStyle = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.04,
  shadowRadius: 24,
  elevation: 2,
};

const styles = StyleSheet.create({
  surface: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  padded: {
    padding: spacing.lg,
  },
  elevated: shadow,
});
