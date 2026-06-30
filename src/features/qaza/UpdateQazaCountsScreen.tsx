import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppText } from '../../components/AppText';
import { Icon } from '../../components/Icon';
import { PrayerIcon } from '../../components/PrayerIcon';
import { Screen } from '../../components/Screen';
import { Surface } from '../../components/Surface';
import { OBLIGATORY_PRAYERS, PRAYER_LABELS } from '../../constants/prayers';
import type { QazaStackParamList } from '../../navigation/types';
import { colors, radius, spacing } from '../../theme';
import type { ObligatoryPrayerKey } from '../../types/prayer';
import { qazaPrayerSubtitles } from './qazaConstants';
import { type QazaCounts, useQazaStore } from './qazaStore';

type UpdateQazaNavigation = NativeStackNavigationProp<
  QazaStackParamList,
  'UpdateQazaCounts'
>;

type DraftCounts = Record<ObligatoryPrayerKey, string>;

export function UpdateQazaCountsScreen(): React.JSX.Element {
  const navigation = useNavigation<UpdateQazaNavigation>();
  const counts = useQazaStore(state => state.counts);
  const replaceCounts = useQazaStore(state => state.replaceCounts);
  const initialDraft = useMemo(() => countsToDraft(counts), [counts]);
  const [draftCounts, setDraftCounts] = useState<DraftCounts>(initialDraft);

  const updateDraft = (prayer: ObligatoryPrayerKey, value: string) => {
    setDraftCounts(current => ({
      ...current,
      [prayer]: value.replace(/\D/g, ''),
    }));
  };

  const adjustDraft = (prayer: ObligatoryPrayerKey, delta: number) => {
    setDraftCounts(current => ({
      ...current,
      [prayer]: String(Math.max(0, parseDraftCount(current[prayer]) + delta)),
    }));
  };

  const saveCounts = () => {
    replaceCounts(draftToCounts(draftCounts));
    navigation.goBack();
  };

  return (
    <Screen contentContainerStyle={styles.screenContent}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Icon name="arrowLeft" size={28} color={colors.primary} />
        </Pressable>
        <AppText variant="headlineMobile" weight="700" align="center">
          Update Counts
        </AppText>
      </View>

      <AppText
        variant="bodyLarge"
        color="onSurfaceVariant"
        align="center"
        style={styles.description}>
        {
          'Adjust your total missed prayer counts. Changes will be saved to your overall Qaza log.'
        }
      </AppText>

      <View style={styles.rows}>
        {OBLIGATORY_PRAYERS.map(prayer => (
          <QazaEditRow
            key={prayer}
            prayer={prayer}
            value={draftCounts[prayer]}
            onChange={value => updateDraft(prayer, value)}
            onIncrease={() => adjustDraft(prayer, 1)}
            onDecrease={() => adjustDraft(prayer, -1)}
          />
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={saveCounts}
        style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}>
        <Icon name="checkCircle" size={28} color={colors.onPrimaryContainer} />
        <AppText variant="bodyLarge" color="onPrimaryContainer" weight="700">
          Save Changes
        </AppText>
      </Pressable>
    </Screen>
  );
}

function QazaEditRow({
  prayer,
  value,
  onChange,
  onIncrease,
  onDecrease,
}: {
  prayer: ObligatoryPrayerKey;
  value: string;
  onChange: (value: string) => void;
  onIncrease: () => void;
  onDecrease: () => void;
}): React.JSX.Element {
  return (
    <Surface padded={false} style={styles.row} radiusSize="xl">
      <View style={styles.prayerDetails}>
        <View style={styles.prayerIcon}>
          <PrayerIcon name={prayer} size={56} />
        </View>
        <View style={styles.prayerText}>
          <AppText variant="title" weight="700" numberOfLines={1}>
            {PRAYER_LABELS[prayer]}
          </AppText>
          <AppText variant="label" color="onSurfaceVariant" weight="700">
            {qazaPrayerSubtitles[prayer]}
          </AppText>
        </View>
      </View>

      <View style={styles.counterControls}>
        <CounterButton
          icon="minus"
          label={`Decrease ${PRAYER_LABELS[prayer]}`}
          onPress={onDecrease}
        />
        <View style={styles.inputWrap}>
          <TextInput
            value={value}
            onChangeText={onChange}
            keyboardType="number-pad"
            maxLength={5}
            placeholder="0"
            placeholderTextColor={colors.outline}
            selectTextOnFocus
            style={styles.input}
          />
        </View>
        <CounterButton
          icon="add"
          label={`Increase ${PRAYER_LABELS[prayer]}`}
          onPress={onIncrease}
        />
      </View>
    </Surface>
  );
}

function CounterButton({
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
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [styles.counterButton, pressed && styles.pressed]}>
      <Icon name={icon} size={26} color={colors.onSurfaceVariant} />
    </Pressable>
  );
}

function countsToDraft(counts: QazaCounts): DraftCounts {
  return OBLIGATORY_PRAYERS.reduce<DraftCounts>(
    (draft, prayer) => ({
      ...draft,
      [prayer]: String(counts[prayer]),
    }),
    {
      fajr: '0',
      dhuhr: '0',
      asr: '0',
      maghrib: '0',
      isha: '0',
    },
  );
}

function draftToCounts(draft: DraftCounts): QazaCounts {
  return OBLIGATORY_PRAYERS.reduce<QazaCounts>(
    (nextCounts, prayer) => ({
      ...nextCounts,
      [prayer]: parseDraftCount(draft[prayer]),
    }),
    {
      fajr: 0,
      dhuhr: 0,
      asr: 0,
      maghrib: 0,
      isha: 0,
    },
  );
}

function parseDraftCount(value: string): number {
  const parsed = Number.parseInt(value, 10);

  return Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
}

const styles = StyleSheet.create({
  screenContent: {
    flexGrow: 1,
    paddingTop: spacing.xl,
    paddingBottom: 120,
    gap: spacing.xl,
  },
  topBar: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    alignSelf: 'center',
    maxWidth: 330,
  },
  rows: {
    gap: spacing.md,
  },
  row: {
    minHeight: 112,
    paddingHorizontal: 14,
    paddingVertical: spacing.md,
    borderWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    shadowOpacity: 0.05,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
  },
  prayerDetails: {
    flex: 1,
    minWidth: 112,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  prayerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prayerText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  counterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  counterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainer,
  },
  inputWrap: {
    width: 64,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.surfaceDim,
  },
  input: {
    width: 64,
    minHeight: 50,
    color: colors.onSurface,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    textAlign: 'center',
    padding: 0,
  },
  saveButton: {
    minHeight: 82,
    marginTop: 'auto',
    borderRadius: radius.full,
    backgroundColor: colors.primaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    shadowColor: colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
});
