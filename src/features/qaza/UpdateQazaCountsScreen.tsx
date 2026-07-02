import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppText } from '../../components/AppText';
import { Icon } from '../../components/Icon';
import { KeyboardAvoidingScreen } from '../../components/KeyboardAvoidingScreen';
import { PrayerIcon } from '../../components/PrayerIcon';
import { Surface } from '../../components/Surface';
import { OBLIGATORY_PRAYERS, PRAYER_LABELS } from '../../constants/prayers';
import type { RootStackParamList } from '../../navigation/types';
import { fontFamilies, radius, spacing, useThemeColors } from '../../theme';
import type { ObligatoryPrayerKey } from '../../types/prayer';
import { qazaPrayerSubtitles } from './qazaConstants';
import {
  getIshaPartCounts,
  getPrayerQazaCount,
  type IshaPartCounts,
  type IshaQazaPart,
  type QazaCounts,
  useQazaStore,
} from './qazaStore';

type UpdateQazaNavigation = NativeStackNavigationProp<
  RootStackParamList,
  'UpdateQazaCounts'
>;

type DraftCounts = Record<ObligatoryPrayerKey, string>;
type DraftIshaSplitCounts = Record<IshaQazaPart, string>;

export function UpdateQazaCountsScreen(): React.JSX.Element {
  const navigation = useNavigation<UpdateQazaNavigation>();
  const colors = useThemeColors();
  const counts = useQazaStore(state => state.counts);
  const ishaSplitEnabled = useQazaStore(state => state.ishaSplitEnabled);
  const replaceCounts = useQazaStore(state => state.replaceCounts);
  const initialDraft = useMemo(() => countsToDraft(counts), [counts]);
  const initialIshaSplitDraft = useMemo(
    () => ishaPartCountsToDraft(getIshaPartCounts(counts)),
    [counts],
  );
  const [draftCounts, setDraftCounts] = useState<DraftCounts>(initialDraft);
  const [draftIshaSplitEnabled, setDraftIshaSplitEnabled] =
    useState(ishaSplitEnabled);
  const [draftIshaSplitCounts, setDraftIshaSplitCounts] =
    useState<DraftIshaSplitCounts>(initialIshaSplitDraft);

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

  const updateIshaDraft = (part: IshaQazaPart, value: string) => {
    setDraftIshaSplitCounts(current => ({
      ...current,
      [part]: value.replace(/\D/g, ''),
    }));
  };

  const adjustIshaDraft = (part: IshaQazaPart, delta: number) => {
    setDraftIshaSplitCounts(current => ({
      ...current,
      [part]: String(Math.max(0, parseDraftCount(current[part]) + delta)),
    }));
  };

  const toggleIshaSplit = (enabled: boolean) => {
    if (enabled) {
      const combinedCount = parseDraftCount(draftCounts.isha);

      setDraftIshaSplitCounts({
        fardh: String(combinedCount),
        witr: String(combinedCount),
      });
      setDraftIshaSplitEnabled(true);

      return;
    }

    const parsedCounts = draftToIshaSplitCounts(draftIshaSplitCounts);

    if (parsedCounts.fardh !== parsedCounts.witr) {
      return;
    }

    setDraftCounts(current => ({
      ...current,
      isha: String(parsedCounts.fardh),
    }));
    setDraftIshaSplitEnabled(false);
  };

  const saveCounts = () => {
    replaceCounts(
      draftToCounts(
        draftCounts,
        draftIshaSplitEnabled,
        draftIshaSplitCounts,
      ),
      draftIshaSplitEnabled,
    );
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
        {OBLIGATORY_PRAYERS.map(prayer =>
          prayer === 'isha' ? (
            <IshaQazaEditRow
              key={prayer}
              splitEnabled={draftIshaSplitEnabled}
              combinedValue={draftCounts.isha}
              splitCounts={draftIshaSplitCounts}
              onToggleSplit={toggleIshaSplit}
              onChangeCombined={value => updateDraft('isha', value)}
              onIncreaseCombined={() => adjustDraft('isha', 1)}
              onDecreaseCombined={() => adjustDraft('isha', -1)}
              onChangeSplit={updateIshaDraft}
              onIncreaseSplit={part => adjustIshaDraft(part, 1)}
              onDecreaseSplit={part => adjustIshaDraft(part, -1)}
            />
          ) : (
            <QazaEditRow
              key={prayer}
              prayer={prayer}
              value={draftCounts[prayer]}
              onChange={value => updateDraft(prayer, value)}
              onIncrease={() => adjustDraft(prayer, 1)}
              onDecrease={() => adjustDraft(prayer, -1)}
            />
          ),
        )}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={saveCounts}
        style={({ pressed }) => [
          styles.saveButton,
          {
            backgroundColor: colors.primaryContainer,
            shadowColor: colors.primary,
          },
          pressed && styles.pressed,
        ]}>
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

      <CountEditor
        value={value}
        decreaseLabel={`Decrease ${PRAYER_LABELS[prayer]}`}
        increaseLabel={`Increase ${PRAYER_LABELS[prayer]}`}
        onChange={onChange}
        onIncrease={onIncrease}
        onDecrease={onDecrease}
      />
    </Surface>
  );
}

function IshaQazaEditRow({
  splitEnabled,
  combinedValue,
  splitCounts,
  onToggleSplit,
  onChangeCombined,
  onIncreaseCombined,
  onDecreaseCombined,
  onChangeSplit,
  onIncreaseSplit,
  onDecreaseSplit,
}: {
  splitEnabled: boolean;
  combinedValue: string;
  splitCounts: DraftIshaSplitCounts;
  onToggleSplit: (enabled: boolean) => void;
  onChangeCombined: (value: string) => void;
  onIncreaseCombined: () => void;
  onDecreaseCombined: () => void;
  onChangeSplit: (part: IshaQazaPart, value: string) => void;
  onIncreaseSplit: (part: IshaQazaPart) => void;
  onDecreaseSplit: (part: IshaQazaPart) => void;
}): React.JSX.Element {
  const colors = useThemeColors();
  const parsedSplitCounts = draftToIshaSplitCounts(splitCounts);
  const canDisableSplit =
    parsedSplitCounts.fardh === parsedSplitCounts.witr;
  const splitToggleDisabled = splitEnabled && !canDisableSplit;

  return (
    <Surface padded={false} style={styles.ishaRow} radiusSize="lg">
      <View style={styles.rowTop}>
        <View style={styles.prayerDetails}>
          <View style={styles.prayerIcon}>
            <PrayerIcon name="isha" size={42} />
          </View>
          <View style={styles.prayerText}>
            <AppText variant="bodyLarge" weight="700" numberOfLines={1}>
              Isha
            </AppText>
            <AppText variant="label" color="onSurfaceVariant">
              {splitEnabled ? 'Fardh and Witr' : qazaPrayerSubtitles.isha}
            </AppText>
          </View>
        </View>

        {!splitEnabled ? (
          <CountEditor
            value={combinedValue}
            decreaseLabel="Decrease Isha"
            increaseLabel="Increase Isha"
            onChange={onChangeCombined}
            onIncrease={onIncreaseCombined}
            onDecrease={onDecreaseCombined}
          />
        ) : null}
      </View>

      <View
        style={[
          styles.ishaToggleRow,
          { borderTopColor: colors.surfaceVariant },
        ]}>
        <View style={styles.ishaToggleText}>
          <AppText variant="label" color="onSurfaceVariant">
            Separate Fardh and Witr
          </AppText>
          {splitToggleDisabled ? (
            <AppText variant="labelSmall" color="onSurfaceVariant">
              Match both counts before combining again.
            </AppText>
          ) : null}
        </View>
        <Switch
          value={splitEnabled}
          disabled={splitToggleDisabled}
          onValueChange={onToggleSplit}
          trackColor={{
            false: colors.surfaceHighest,
            true: colors.secondaryContainer,
          }}
          thumbColor={splitEnabled ? colors.primary : colors.outline}
        />
      </View>

      {splitEnabled ? (
        <View style={styles.ishaSplitInputs}>
          <SplitCountEditor
            label="Fardh"
            value={splitCounts.fardh}
            onChange={value => onChangeSplit('fardh', value)}
            onIncrease={() => onIncreaseSplit('fardh')}
            onDecrease={() => onDecreaseSplit('fardh')}
          />
          <SplitCountEditor
            label="Witr"
            value={splitCounts.witr}
            onChange={value => onChangeSplit('witr', value)}
            onIncrease={() => onIncreaseSplit('witr')}
            onDecrease={() => onDecreaseSplit('witr')}
          />
        </View>
      ) : null}
    </Surface>
  );
}

function SplitCountEditor({
  label,
  value,
  onChange,
  onIncrease,
  onDecrease,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onIncrease: () => void;
  onDecrease: () => void;
}): React.JSX.Element {
  return (
    <View style={styles.splitEditorRow}>
      <AppText variant="label" color="onSurfaceVariant">
        {label}
      </AppText>
      <CountEditor
        value={value}
        decreaseLabel={`Decrease Isha ${label}`}
        increaseLabel={`Increase Isha ${label}`}
        onChange={onChange}
        onIncrease={onIncrease}
        onDecrease={onDecrease}
      />
    </View>
  );
}

function CountEditor({
  value,
  decreaseLabel,
  increaseLabel,
  onChange,
  onIncrease,
  onDecrease,
}: {
  value: string;
  decreaseLabel: string;
  increaseLabel: string;
  onChange: (value: string) => void;
  onIncrease: () => void;
  onDecrease: () => void;
}): React.JSX.Element {
  const colors = useThemeColors();

  return (
    <View style={styles.counterControls}>
      <CounterButton
        icon="minus"
        label={decreaseLabel}
        onPress={onDecrease}
      />
      <View
        style={[
          styles.inputWrap,
          { borderBottomColor: colors.surfaceDim },
        ]}>
        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType="number-pad"
          maxLength={5}
          placeholder="0"
          placeholderTextColor={colors.outline}
          selectTextOnFocus
          style={[styles.input, { color: colors.onSurface }]}
        />
      </View>
      <CounterButton
        icon="add"
        label={increaseLabel}
        onPress={onIncrease}
      />
    </View>
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
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [
        styles.counterButton,
        { backgroundColor: colors.surfaceContainer },
        pressed && styles.pressed,
      ]}>
      <Icon name={icon} size={22} color={colors.onSurfaceVariant} />
    </Pressable>
  );
}

function countsToDraft(counts: QazaCounts): DraftCounts {
  return OBLIGATORY_PRAYERS.reduce<DraftCounts>(
    (draft, prayer) => ({
      ...draft,
      [prayer]: String(getPrayerQazaCount(counts, prayer)),
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

function ishaPartCountsToDraft(
  counts: IshaPartCounts,
): DraftIshaSplitCounts {
  return {
    fardh: String(counts.fardh),
    witr: String(counts.witr),
  };
}

function draftToCounts(
  draft: DraftCounts,
  ishaSplitEnabled: boolean,
  ishaSplitDraft: DraftIshaSplitCounts,
): QazaCounts {
  const combinedIshaCount = parseDraftCount(draft.isha);
  const ishaPartCounts = draftToIshaSplitCounts(ishaSplitDraft);

  return {
    fajr_fardh: parseDraftCount(draft.fajr),
    dhuhr_fardh: parseDraftCount(draft.dhuhr),
    asr_fardh: parseDraftCount(draft.asr),
    maghrib_fardh: parseDraftCount(draft.maghrib),
    isha_fardh: ishaSplitEnabled
      ? ishaPartCounts.fardh
      : combinedIshaCount,
    isha_witr: ishaSplitEnabled
      ? ishaPartCounts.witr
      : combinedIshaCount,
  };
}

function draftToIshaSplitCounts(
  draft: DraftIshaSplitCounts,
): IshaPartCounts {
  return {
    fardh: parseDraftCount(draft.fardh),
    witr: parseDraftCount(draft.witr),
  };
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    shadowOpacity: 0.05,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  ishaRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    shadowOpacity: 0.05,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  rowTop: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
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
  ishaSplitInputs: {
    gap: spacing.xs,
  },
  splitEditorRow: {
    minHeight: 44,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  counterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrap: {
    width: 52,
    alignItems: 'center',
    borderBottomWidth: 2,
  },
  input: {
    width: 52,
    minHeight: 42,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
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
