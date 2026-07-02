import React from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppText } from '../../components/AppText';
import { Icon } from '../../components/Icon';
import { PrayerIcon } from '../../components/PrayerIcon';
import { Screen } from '../../components/Screen';
import { Surface } from '../../components/Surface';
import { OBLIGATORY_PRAYERS, PRAYER_LABELS } from '../../constants/prayers';
import type { RootStackParamList } from '../../navigation/types';
import { radius, spacing, useThemeColors } from '../../theme';
import type { ObligatoryPrayerKey } from '../../types/prayer';
import { qazaPrayerSubtitles } from './qazaConstants';
import {
  canTurnOffIshaSplit,
  getIshaPartCounts,
  getPrayerQazaCount,
  getTotalQaza,
  type IshaQazaPart,
  type QazaCounts,
  useQazaStore,
} from './qazaStore';

type QazaNavigation = NativeStackNavigationProp<RootStackParamList>;

export function QazaScreen(): React.JSX.Element {
  const navigation = useNavigation<QazaNavigation>();
  const colors = useThemeColors();
  const counts = useQazaStore(state => state.counts);
  const ishaSplitEnabled = useQazaStore(state => state.ishaSplitEnabled);
  const total = getTotalQaza(counts, ishaSplitEnabled);

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="headline" weight="700" style={styles.headerTitle}>
          Qaza Counter
        </AppText>
        <AppText
          variant="body"
          color="onSurfaceVariant"
          style={styles.headerNote}
        >
          Manage your missed prayers. These counts show your remaining Qaza. Tap
          check to complete one Qaza.
        </AppText>
        <View style={styles.headerActions}>
          <Pressable
            accessibilityLabel="Edit all Qaza counts"
            accessibilityRole="button"
            onPress={() => navigation.navigate('UpdateQazaCounts')}
            style={({ pressed }) => [
              styles.editLink,
              pressed && styles.pressed,
            ]}
          >
            <Icon name="editList" size={20} color={colors.primary} />
            <AppText variant="label" color="primary">
              Edit All Counts
            </AppText>
          </Pressable>
          <View
            style={[
              styles.totalPill,
              { backgroundColor: colors.primarySoft },
            ]}>
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
            align="right"
          >
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
  const counts = useQazaStore(state => state.counts);
  const ishaSplitEnabled = useQazaStore(state => state.ishaSplitEnabled);
  const setIshaSplitEnabled = useQazaStore(
    state => state.setIshaSplitEnabled,
  );
  const completeOne = useQazaStore(state => state.completeOne);
  const count = getPrayerQazaCount(counts, prayer);
  const ishaPartCounts = getIshaPartCounts(counts);
  const isIsha = prayer === 'isha';
  const isSplitIsha = isIsha && ishaSplitEnabled;
  const isEmpty = count === 0;
  const canCompleteBoth =
    ishaPartCounts.fardh > 0 && ishaPartCounts.witr > 0;

  return (
    <Surface padded={false} style={styles.card} radiusSize="lg">
      <View style={styles.cardMainRow}>
        <View style={styles.prayerIcon}>
          <PrayerIcon name={prayer} size={42} />
        </View>
        <View style={styles.cardText}>
          <AppText variant="bodyLarge" weight="700" numberOfLines={1}>
            {PRAYER_LABELS[prayer]}
          </AppText>
          <AppText variant="label" color="onSurfaceVariant">
            {isSplitIsha ? 'Fardh and Witr' : qazaPrayerSubtitles[prayer]}
          </AppText>
        </View>
        {isSplitIsha ? (
          <QazaCompleteBothButton
            disabled={!canCompleteBoth}
            onPress={() => completeOne('isha')}
          />
        ) : (
          <View style={styles.cardActions}>
            <View style={styles.countWrap}>
              <AppText variant="title" color="primary" weight="700">
                {count}
              </AppText>
            </View>
            <QazaCompleteButton
              disabled={isEmpty}
              label={`Remove one ${PRAYER_LABELS[prayer]} Qaza`}
              onPress={() => completeOne(prayer)}
            />
          </View>
        )}
      </View>

      {isIsha ? (
        <IshaSplitToggle
          enabled={ishaSplitEnabled}
          counts={counts}
          onToggle={setIshaSplitEnabled}
        />
      ) : null}

      {isSplitIsha ? (
        <View style={styles.ishaSplitRows}>
          <IshaSplitCounterRow
            label="Fardh"
            count={ishaPartCounts.fardh}
            part="fardh"
            onComplete={part => completeOne('isha', part)}
          />
          <IshaSplitCounterRow
            label="Witr"
            count={ishaPartCounts.witr}
            part="witr"
            onComplete={part => completeOne('isha', part)}
          />
        </View>
      ) : null}
    </Surface>
  );
}

function IshaSplitToggle({
  enabled,
  counts,
  onToggle,
}: {
  enabled: boolean;
  counts: QazaCounts;
  onToggle: (enabled: boolean) => void;
}): React.JSX.Element {
  const colors = useThemeColors();
  const canDisable = canTurnOffIshaSplit(counts);
  const disabled = enabled && !canDisable;

  return (
    <View
      style={[
        styles.ishaToggleRow,
        { borderTopColor: colors.surfaceVariant },
      ]}>
      <View style={styles.ishaToggleText}>
        <AppText variant="label" color="onSurfaceVariant">
          Separate Fardh and Witr
        </AppText>
        {disabled ? (
          <AppText variant="labelSmall" color="onSurfaceVariant">
            Match both counts before combining again.
          </AppText>
        ) : null}
      </View>
      <Switch
        value={enabled}
        disabled={disabled}
        onValueChange={onToggle}
        trackColor={{
          false: colors.surfaceHighest,
          true: colors.secondaryContainer,
        }}
        thumbColor={enabled ? colors.primary : colors.outline}
      />
    </View>
  );
}

function IshaSplitCounterRow({
  label,
  count,
  part,
  onComplete,
}: {
  label: string;
  count: number;
  part: IshaQazaPart;
  onComplete: (part: IshaQazaPart) => void;
}): React.JSX.Element {
  const isEmpty = count === 0;

  return (
    <View style={styles.ishaSplitCounterRow}>
      <AppText variant="label" color="onSurfaceVariant">
        {label}
      </AppText>
      <View style={styles.cardActions}>
        <View style={styles.countWrap}>
          <AppText variant="title" color="primary" weight="700">
            {count}
          </AppText>
        </View>
        <QazaCompleteButton
          disabled={isEmpty}
          label={`Remove one Isha ${label} Qaza`}
          onPress={() => onComplete(part)}
        />
      </View>
    </View>
  );
}

function QazaCompleteBothButton({
  disabled,
  onPress,
}: {
  disabled: boolean;
  onPress: () => void;
}): React.JSX.Element {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityLabel="Remove one Isha Fardh and Witr Qaza"
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.completeBothButton,
        {
          backgroundColor: disabled
            ? colors.surfaceContainer
            : colors.primaryContainer,
        },
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Icon
        name="minusOneCheck"
        size={20}
        color={disabled ? colors.outline : colors.onPrimaryContainer}
      />
      <AppText
        variant="labelSmall"
        color={disabled ? 'onSurfaceVariant' : 'onPrimaryContainer'}
        weight="700"
      >
        Both
      </AppText>
    </Pressable>
  );
}

function QazaCompleteButton({
  disabled,
  label,
  onPress,
}: {
  disabled: boolean;
  label: string;
  onPress: () => void;
}): React.JSX.Element {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.completeButton,
        {
          backgroundColor: disabled
            ? colors.surfaceContainer
            : colors.primaryContainer,
        },
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Icon
        name="minusOneCheck"
        size={22}
        color={disabled ? colors.outline : colors.onPrimaryContainer}
      />
    </Pressable>
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
    gap: spacing.sm,
  },
  cardMainRow: {
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeBothButton: {
    minWidth: 76,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  ishaToggleRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  ishaToggleText: {
    flex: 1,
    gap: 2,
  },
  ishaSplitRows: {
    gap: spacing.xs,
  },
  ishaSplitCounterRow: {
    minHeight: 44,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
});
