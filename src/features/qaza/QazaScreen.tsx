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
import { useQazaStore } from './qazaStore';

type QazaNavigation = NativeStackNavigationProp<RootStackParamList>;

export function QazaScreen(): React.JSX.Element {
  const navigation = useNavigation<QazaNavigation>();

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="headline" weight="700">
          Qaza Counter
        </AppText>
        <AppText variant="bodyLarge" color="onSurfaceVariant">
          Manage your missed prayers
        </AppText>
        <Pressable
          accessibilityLabel="Edit all Qaza counts"
          accessibilityRole="button"
          onPress={() => navigation.navigate('UpdateQazaCounts')}
          style={({ pressed }) => [styles.editLink, pressed && styles.pressed]}>
          <Icon name="editList" size={20} color={colors.primary} />
          <AppText variant="label" color="primary">
            Edit All Counts
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
    <Surface padded={false} style={styles.card} radiusSize="lg">
      <View style={styles.prayerIcon}>
        <PrayerIcon name={prayer} size={42} />
      </View>
      <View style={styles.cardText}>
        <AppText variant="bodyLarge" weight="700" numberOfLines={1}>
          {PRAYER_LABELS[prayer]}
        </AppText>
        <AppText variant="label" color="onSurfaceVariant">
          Qaza remaining
        </AppText>
      </View>
      <View style={styles.cardActions}>
        <View style={styles.countWrap}>
          <AppText variant="title" color="primary" weight="700">
            {count}
          </AppText>
        </View>
        <Pressable
          accessibilityLabel={`Completed one ${PRAYER_LABELS[prayer]} Qaza`}
          accessibilityRole="button"
          accessibilityState={{ disabled: isEmpty }}
          disabled={isEmpty}
          hitSlop={8}
          onPress={() => completeOne(prayer)}
          style={({ pressed }) => [
            styles.completeButton,
            isEmpty && styles.completeButtonDisabled,
            pressed && !isEmpty && styles.pressed,
          ]}>
          <Icon
            name="check"
            size={18}
            color={isEmpty ? colors.outline : colors.onPrimaryContainer}
          />
        </Pressable>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
  },
  editLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingTop: spacing.xs,
    paddingRight: spacing.sm,
    paddingBottom: spacing.xs,
  },
  cards: {
    gap: spacing.sm,
  },
  card: {
    minHeight: 78,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderColor: 'rgba(228, 226, 221, 0.65)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  prayerIcon: {
    width: 42,
    height: 42,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardText: {
    flex: 1,
    minWidth: 0,
    gap: 0,
    justifyContent: 'center',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  countWrap: {
    minWidth: 34,
    alignItems: 'flex-end',
  },
  completeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeButtonDisabled: {
    backgroundColor: colors.surfaceContainer,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
});
