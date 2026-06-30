import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
} from 'react-native';

import { colors, spacing } from '../theme';

interface ScreenProps extends ScrollViewProps {
  children: React.ReactNode;
  patterned?: boolean;
}

export function Screen({
  children,
  patterned = false,
  contentContainerStyle,
  ...rest
}: ScreenProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      {patterned ? <PatternOverlay /> : null}
      <ScrollView
        {...rest}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, contentContainerStyle]}>
        {children}
      </ScrollView>
    </View>
  );
}

function PatternOverlay(): React.JSX.Element {
  return <View pointerEvents="none" style={styles.pattern} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.container,
    paddingTop: spacing.lg,
    paddingBottom: 32,
    gap: spacing.xl,
  },
  pattern: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 0.22,
    backgroundColor: colors.background,
  },
});
