import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '../../components/AppText';
import { colors, radius, spacing } from '../../theme';

interface SettingsContentBlockProps {
  title: string;
  children: React.ReactNode;
}

export function SettingsContentBlock({
  title,
  children,
}: SettingsContentBlockProps): React.JSX.Element {
  return (
    <View style={styles.block}>
      <AppText variant="bodyLarge" weight="700">
        {title}
      </AppText>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

export function SettingsParagraph({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <AppText variant="body" color="onSurfaceVariant" style={styles.paragraph}>
      {children}
    </AppText>
  );
}

export function SettingsBullet({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.bulletDot} />
      <AppText
        variant="body"
        color="onSurfaceVariant"
        style={styles.bulletText}>
        {children}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceLowest,
    gap: spacing.sm,
    padding: spacing.md,
  },
  content: {
    gap: spacing.sm,
  },
  paragraph: {
    lineHeight: 23,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 9,
    backgroundColor: colors.primary,
  },
  bulletText: {
    flex: 1,
    lineHeight: 23,
  },
});
