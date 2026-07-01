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
import { qazaPrayerSubtitles } from './qazaConstants';
import { getTotalQaza, useQazaStore } from './qazaStore';

type QazaNavigation = NativeStackNavigationProp<RootStackParamList>;

export function QazaScreen(): React.JSX.Element {
  const navigation = useNavigation<QazaNavigation>();
  const counts = useQazaStore(state => state.counts);
  const total = getTotalQaza(counts);

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="headline" weight="700" style={styles.headerTitle}>
          Qaza Counter
        </AppText>
        <AppText
          variant="body"
          color="onSurfaceVariant"
          style={styles.headerNote}>
          Manage your missed prayers. These counts show your remaining Qaza.
          Tap -1 to complete one Qaza.
        </AppText>
        <View style={styles.headerActions}>
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
          <View style={styles.totalPill}>
            <AppText variant="label" color="primary" weight="700">
              Total:
            </AppText>
            <AppText variant="label" color="primary" weight="700">
              {total}
            </AppText>
          </View>
        </View>
      </View>

      <View style={styles.listSection}>
        <View style={styles.listHeader}>
          <AppText
            variant="labelSmall"
            color="onSurfaceVariant"
            transform="uppercase"
            align="right">
            Remaining Qaza
          </AppText>
        </View>

        <View style={styles.cards}>
          {OBLIGATORY_PRAYERS.map(prayer => (
            <QazaCard key={prayer} prayer={prayer} />
          ))}
        </View>
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
          {qazaPrayerSubtitles[prayer]}
        </AppText>
      </View>
      <View style={styles.cardActions}>
        <View style={styles.countWrap}>
          <AppText variant="title" color="primary" weight="700">
            {count}
          </AppText>
        </View>
        <Pressable
          accessibilityLabel={`Remove one ${PRAYER_LABELS[prayer]} Qaza`}
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
            name="minusOneCheck"
            size={22}
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
  headerTitle: {
    fontSize: 36,
    lineHeight: 44,
  },
  headerNote: {
    maxWidth: 330,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
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
  totalPill: {
    minHeight: 32,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0, 106, 57, 0.1)',
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  listSection: {
    gap: spacing.xs,
  },
  listHeader: {
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.md,
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
