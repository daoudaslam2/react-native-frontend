import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppText } from '../../components/AppText';
import { Icon } from '../../components/Icon';
import { PrayerIcon } from '../../components/PrayerIcon';
import { Screen } from '../../components/Screen';
import { Surface } from '../../components/Surface';
import { OBLIGATORY_PRAYERS, PRAYER_LABELS } from '../../constants/prayers';
import type { RootStackParamList } from '../../navigation/types';
import { colors, radius, spacing } from '../../theme';
import type { ObligatoryPrayerKey } from '../../types/prayer';
import { getTotalQaza, useQazaStore } from './qazaStore';

type QazaNavigation = NativeStackNavigationProp<RootStackParamList>;

export function QazaScreen(): React.JSX.Element {
  const navigation = useNavigation<QazaNavigation>();
  const counts = useQazaStore(state => state.counts);
  const total = getTotalQaza(counts);

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="display">Qaza Counter</AppText>
        <AppText variant="bodyLarge" color="onSurfaceVariant">
          Manage your missed prayers
        </AppText>
        <View style={styles.totalPill}>
          <Icon name="task" size={18} color={colors.primary} />
          <AppText variant="label" color="primary">
            {total} remaining
          </AppText>
        </View>
        <Pressable
          onPress={() => navigation.navigate('UpdateQazaCounts')}
          style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}>
          <AppText variant="label" color="onPrimaryContainer" weight="700">
            Update All Counts
          </AppText>
        </Pressable>
      </View>

      <View style={styles.cards}>
        {OBLIGATORY_PRAYERS.map(prayer => (
          <QazaCard key={prayer} prayer={prayer} />
        ))}
      </View>
    </Screen>
  );
}

function QazaCard({
  prayer,
}: {
  prayer: ObligatoryPrayerKey;
}): React.JSX.Element {
  const count = useQazaStore(state => state.counts[prayer]);
  const completeOne = useQazaStore(state => state.completeOne);
  const isEmpty = count === 0;

  return (
    <Surface style={styles.card} radiusSize="lg">
      <View style={styles.cardHeader}>
        <View style={styles.prayerName}>
          <View style={styles.prayerIcon}>
            <PrayerIcon name={prayer} size={44} />
          </View>
          <AppText variant="title">{PRAYER_LABELS[prayer]}</AppText>
        </View>
        <View style={styles.countPill}>
          <AppText variant="title" color="primary" weight="700">
            {count}
          </AppText>
        </View>
      </View>
      <Pressable
        disabled={isEmpty}
        onPress={() => completeOne(prayer)}
        style={({ pressed }) => [
          styles.completeButton,
          isEmpty && styles.completeButtonDisabled,
          pressed && !isEmpty && styles.pressed,
        ]}>
        <AppText
          variant="label"
          color={isEmpty ? 'onSurfaceVariant' : 'onPrimaryContainer'}
          weight="700">
          Completed One Qaza
        </AppText>
      </Pressable>
    </Surface>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
  },
  totalPill: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    backgroundColor: 'rgba(0, 106, 57, 0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  editButton: {
    marginTop: spacing.xs,
    minHeight: 48,
    borderRadius: radius.full,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  cards: {
    gap: spacing.md,
  },
  card: {
    gap: spacing.lg,
    borderColor: 'rgba(228, 226, 221, 0.65)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  prayerName: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  prayerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countPill: {
    minWidth: 54,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 106, 57, 0.1)',
  },
  completeButton: {
    minHeight: 56,
    borderRadius: radius.md,
    backgroundColor: colors.primaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeButtonDisabled: {
    backgroundColor: colors.surfaceHigh,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
});
