import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '../theme';
import { AppText } from './AppText';

export function TopAppBar(): React.JSX.Element {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.bar}>
        <View style={styles.edgeSpacer} />
        <AppText variant="headlineMobile" color="primary" weight="700">
          Al-Salah
        </AppText>
        <Pressable accessibilityRole="button" style={styles.avatarButton}>
          <View style={styles.avatar}>
            <AppText variant="labelSmall" color="primary" weight="700">
              U
            </AppText>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(251, 249, 244, 0.92)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(189, 202, 188, 0.4)',
  },
  bar: {
    height: 64,
    paddingHorizontal: spacing.container,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  edgeSpacer: {
    width: 40,
    height: 40,
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    overflow: 'hidden',
    backgroundColor: colors.surfaceVariant,
  },
  avatar: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondaryContainer,
  },
});
