import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../components/AppText';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import { Surface } from '../../components/Surface';
import { OBLIGATORY_PRAYERS, PRAYER_LABELS } from '../../constants/prayers';
import { colors, radius, spacing } from '../../theme';
import type { ObligatoryPrayerKey } from '../../types/prayer';
import { getTotalQaza, useQazaStore } from './qazaStore';

export function QazaScreen(): React.JSX.Element {
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
  const increase = useQazaStore(state => state.increase);
  const decrease = useQazaStore(state => state.decrease);
  const completeOne = useQazaStore(state => state.completeOne);
  const isEmpty = count === 0;

  return (
    <Surface style={styles.card} radiusSize="lg">
      <View style={styles.cardHeader}>
        <View style={styles.cardTitle}>
          <AppText variant="title">{PRAYER_LABELS[prayer]}</AppText>
          <AppText variant="body" color="onSurfaceVariant">
            Qaza Remaining:{' '}
            <AppText variant="body" color="primary" weight="700">
              {count}
            </AppText>
          </AppText>
        </View>
        <View style={styles.stepper}>
          <StepperButton
            icon="minus"
            label="Decrease"
            onPress={() => decrease(prayer)}
          />
          <AppText variant="title" align="center" style={styles.count}>
            {count}
          </AppText>
          <StepperButton
            icon="add"
            label="Increase"
            onPress={() => increase(prayer)}
          />
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
        <Icon
          name="task"
          size={20}
          color={isEmpty ? colors.onSurfaceVariant : colors.onPrimaryContainer}
          filled={!isEmpty}
        />
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

function StepperButton({
  icon,
  label,
  onPress,
}: {
  icon: 'add' | 'minus';
  label: string;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.stepperButton, pressed && styles.pressed]}>
      <Icon name={icon} color={colors.onSurface} />
    </Pressable>
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
  cards: {
    gap: spacing.md,
  },
  card: {
    gap: spacing.lg,
    borderColor: 'rgba(228, 226, 221, 0.65)',
  },
  cardHeader: {
    gap: spacing.md,
  },
  cardTitle: {
    gap: spacing.xs,
  },
  stepper: {
    minHeight: 58,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surfaceVariant,
    backgroundColor: colors.surfaceLow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.xs,
  },
  stepperButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    minWidth: 48,
  },
  completeButton: {
    minHeight: 56,
    borderRadius: radius.md,
    backgroundColor: colors.primaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  completeButtonDisabled: {
    backgroundColor: colors.surfaceHigh,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
});
