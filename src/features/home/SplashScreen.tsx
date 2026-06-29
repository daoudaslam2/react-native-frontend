import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';

import { AppText } from '../../components/AppText';
import { LogoMark } from '../../components/LogoMark';
import { colors, spacing } from '../../theme';

export function SplashScreen(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <View style={styles.pattern} />
      <Animated.View entering={FadeInUp.duration(900)} style={styles.logoWrap}>
        <View style={styles.logoGlow} />
        <LogoMark size={160} inverse />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(250).duration(700)}>
        <AppText variant="display" style={styles.title}>
          Al-Salah
        </AppText>
      </Animated.View>
      <Animated.View entering={FadeIn.delay(850).duration(600)} style={styles.dots}>
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  pattern: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 0.12,
    backgroundColor: colors.primary,
  },
  logoWrap: {
    marginBottom: spacing.xl,
  },
  logoGlow: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(255,255,255,0.24)',
  },
  title: {
    color: colors.onPrimary,
  },
  dots: {
    position: 'absolute',
    bottom: 56,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
});
