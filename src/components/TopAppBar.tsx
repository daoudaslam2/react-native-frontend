import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius, spacing, useAppTheme } from '../theme';
import { AppText } from './AppText';

export function TopAppBar(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { colors, resolvedTheme } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        resolvedTheme === 'dark'
          ? styles.containerDark
          : styles.containerLight,
        {
          paddingTop: insets.top,
        },
      ]}>
      <View style={styles.bar}>
        <View style={styles.edgeSpacer} />
        <AppText variant="headlineMobile" color="primary" weight="700">
          Al-Salah
        </AppText>
        <Pressable
          accessibilityRole="button"
          style={[
            styles.avatarButton,
            { backgroundColor: colors.surfaceVariant },
          ]}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: colors.secondaryContainer },
            ]}>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  containerLight: {
    backgroundColor: 'rgba(251, 249, 244, 0.92)',
    borderBottomColor: 'rgba(189, 202, 188, 0.4)',
  },
  containerDark: {
    backgroundColor: 'rgba(17, 21, 17, 0.92)',
    borderBottomColor: 'rgba(70, 82, 71, 0.55)',
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
  },
  avatar: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
