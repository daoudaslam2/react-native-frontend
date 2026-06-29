import React from 'react';
import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { colors, typography, type ColorToken, type TextVariant } from '../theme';

interface AppTextProps extends TextProps {
  variant?: TextVariant;
  color?: ColorToken;
  align?: TextStyle['textAlign'];
  weight?: TextStyle['fontWeight'];
  transform?: TextStyle['textTransform'];
}

export function AppText({
  variant = 'body',
  color = 'onSurface',
  align,
  weight,
  transform,
  style,
  children,
  ...rest
}: AppTextProps): React.JSX.Element {
  return (
    <Text
      {...rest}
      style={[
        styles.base,
        typography[variant],
        {
          color: colors[color],
          textAlign: align,
          fontWeight: weight,
          textTransform: transform,
        },
        style,
      ]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
});
