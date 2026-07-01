import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppText } from '../../components/AppText';
import { Icon } from '../../components/Icon';
import { KeyboardAvoidingScreen } from '../../components/KeyboardAvoidingScreen';
import { PrayerIcon } from '../../components/PrayerIcon';
import { Surface } from '../../components/Surface';
import { OBLIGATORY_PRAYERS, PRAYER_LABELS } from '../../constants/prayers';
import type { RootStackParamList } from '../../navigation/types';
import { colors, fontFamilies, radius, spacing } from '../../theme';
import type { ObligatoryPrayerKey } from '../../types/prayer';
import { qazaPrayerSubtitles } from './qazaConstants';
import { type QazaCounts, useQazaStore } from './qazaStore';

type UpdateQazaNavigation = NativeStackNavigationProp<
  RootStackParamList,
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
    <KeyboardAvoidingScreen contentContainerStyle={styles.screenContent}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Icon name="arrowLeft" size={26} color={colors.primary} />
        </Pressable>
        <AppText variant="title" weight="700" align="center">
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
        <Icon name="checkCircle" size={24} color={colors.onPrimaryContainer} />
        <AppText variant="body" color="onPrimaryContainer" weight="700">
          Save Changes
        </AppText>
      </Pressable>
    </KeyboardAvoidingScreen>
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
    <Surface padded={false} style={styles.row} radiusSize="lg">
      <View style={styles.prayerDetails}>
        <View style={styles.prayerIcon}>
          <PrayerIcon name={prayer} size={42} />
        </View>
        <View style={styles.prayerText}>
          <AppText variant="bodyLarge" weight="700" numberOfLines={1}>
            {PRAYER_LABELS[prayer]}
          </AppText>
          <AppText variant="label" color="onSurfaceVariant">
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
      <Icon name={icon} size={22} color={colors.onSurfaceVariant} />
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
    paddingBottom: 32,
    gap: spacing.lg,
  },
  topBar: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    alignSelf: 'center',
    maxWidth: 320,
  },
  rows: {
    gap: spacing.sm,
  },
  row: {
    minHeight: 78,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderColor: 'rgba(228, 226, 221, 0.65)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    shadowOpacity: 0.05,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  prayerDetails: {
    flex: 1,
    minWidth: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  prayerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prayerText: {
    flex: 1,
    minWidth: 0,
    gap: 0,
    justifyContent: 'center',
  },
  counterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  counterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainer,
  },
  inputWrap: {
    width: 52,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.surfaceDim,
  },
  input: {
    width: 52,
    minHeight: 42,
    color: colors.onSurface,
    fontFamily: fontFamilies.bold,
    fontSize: 24,
    lineHeight: 30,
    textAlign: 'center',
    padding: 0,
  },
  saveButton: {
    minHeight: 58,
    marginTop: 'auto',
    marginBottom: spacing.md,
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
