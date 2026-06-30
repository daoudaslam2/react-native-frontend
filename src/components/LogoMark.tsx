import React from 'react';
import { Image, StyleSheet } from 'react-native';

const logoSource = require('../assets/logo.png');

interface LogoMarkProps {
  size?: number;
  inverse?: boolean;
}

export function LogoMark({ size = 112 }: LogoMarkProps): React.JSX.Element {
  return (
    <Image
      source={logoSource}
      resizeMode="contain"
      style={[
        styles.logo,
        {
          width: size,
          height: size,
          borderRadius: size * 0.18,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    overflow: 'hidden',
  },
});
