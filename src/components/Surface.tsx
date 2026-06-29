import React from 'react';
import { StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '../theme';

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
  return (
    <View
      {...rest}
      style={[
        styles.surface,
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
    backgroundColor: colors.surfaceLowest,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surfaceVariant,
  },
  padded: {
    padding: spacing.lg,
  },
  elevated: shadow,
});
