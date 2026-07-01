import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { AppText } from '../../components/AppText';
import { Icon } from '../../components/Icon';
import {
  ISHA_DEADLINE_STEP_MINUTES,
  MAX_ISHA_DEADLINE_MINUTES,
} from '../../constants/prayerSettings';
import { useNow } from '../../hooks/useNow';
import {
  getIshaDeadlineBounds,
  type IshaDeadlineBounds,
} from '../../services/prayer/prayerCalculator';
import { colors, radius, spacing } from '../../theme';
import { formatPrayerTime } from '../../utils/dateTime';
import {
  SettingsDetailScaffold,
  SettingsPrimaryButton,
} from './SettingsDetailScaffold';
import { useSettingsStore } from './settingsStore';

export function IshaEndTimeSettingsScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const now = useNow(60_000);
  const calculationMethod = useSettingsStore(state => state.calculationMethod);
  const asrMethod = useSettingsStore(state => state.asrMethod);
  const location = useSettingsStore(state => state.location);
  const use24HourTime = useSettingsStore(state => state.use24HourTime);
  const ishaDeadlineMinutes = useSettingsStore(
    state => state.ishaDeadlineMinutes,
  );
  const setIshaDeadlineMinutes = useSettingsStore(
    state => state.setIshaDeadlineMinutes,
  );
  const [selectedMinutes, setSelectedMinutes] = React.useState<number | null>(
    ishaDeadlineMinutes,
  );

  const bounds = location
    ? getIshaDeadlineBounds({
        now,
        calculationMethod,
        asrMethod,
        ishaDeadlineMinutes: selectedMinutes,
        location,
      })
    : null;

  const handleUpdate = () => {
    setIshaDeadlineMinutes(selectedMinutes);
    navigation.goBack();
  };

  return (
    <SettingsDetailScaffold
      title="Isha End Time"
      subtitle="Set when Isha stops being treated as current. It cannot be earlier than Islamic midnight or later than 2:00 AM."
      footer={
        <SettingsPrimaryButton
          label="Update Isha End Time"
          disabled={!bounds}
          onPress={handleUpdate}
        />
      }>
      {bounds && location ? (
        <IshaDeadlineEditor
          value={selectedMinutes}
          bounds={bounds}
          use24HourTime={use24HourTime}
          timeZone={location.timeZone}
          onChange={setSelectedMinutes}
        />
      ) : (
        <View style={styles.emptyCard}>
          <Icon name="location" color={colors.onSurfaceVariant} />
          <View style={styles.emptyText}>
            <AppText variant="bodyLarge" weight="700">
              Location required
            </AppText>
            <AppText variant="body" color="onSurfaceVariant">
              Set your prayer location before changing the Isha end time.
            </AppText>
          </View>
        </View>
      )}
    </SettingsDetailScaffold>
  );
}

function IshaDeadlineEditor({
  value,
  bounds,
  use24HourTime,
  timeZone,
  onChange,
}: {
  value: number | null;
  bounds: IshaDeadlineBounds;
  use24HourTime: boolean;
  timeZone: string;
  onChange: (minutes: number | null) => void;
}): React.JSX.Element {
  const currentLabel = formatPrayerTime(
    bounds.resolved,
    use24HourTime,
    timeZone,
  );
  const minimumLabel = formatPrayerTime(
    bounds.minimum,
    use24HourTime,
    timeZone,
  );
  const maximumLabel = formatPrayerTime(
    bounds.maximum,
    use24HourTime,
    timeZone,
  );
  const canDecrease = bounds.resolvedMinutes > bounds.minimumMinutes;
  const canIncrease = bounds.resolvedMinutes < bounds.maximumMinutes;

  return (
    <>
      <View style={styles.valueCard}>
        <AppText variant="label" color="onSurfaceVariant">
          Current selection
        </AppText>
        <AppText variant="display" weight="700" align="center">
          {currentLabel}
        </AppText>
        <AppText variant="labelSmall" color="onSurfaceVariant" align="center">
          Allowed range: {minimumLabel} - {maximumLabel}
        </AppText>
      </View>

      <View style={styles.deadlineControl}>
        <DeadlineIconButton
          icon="minus"
          disabled={!canDecrease}
          onPress={() => onChange(getSteppedIshaDeadline(bounds, -1))}
        />
        <View style={styles.controlText}>
          <AppText variant="bodyLarge" weight="700" align="center">
            Adjust by 15 minutes
          </AppText>
          <AppText variant="body" color="onSurfaceVariant" align="center">
            {value === null ? 'Islamic midnight' : 'Custom time'}
          </AppText>
        </View>
        <DeadlineIconButton
          icon="add"
          disabled={!canIncrease}
          onPress={() => onChange(getSteppedIshaDeadline(bounds, 1))}
        />
      </View>

      <View style={styles.presets}>
        <DeadlinePreset
          label="Islamic midnight"
          selected={value === null}
          onPress={() => onChange(null)}
        />
        <DeadlinePreset
          label="2:00 AM"
          selected={bounds.resolvedMinutes === MAX_ISHA_DEADLINE_MINUTES}
          onPress={() => onChange(MAX_ISHA_DEADLINE_MINUTES)}
        />
      </View>
    </>
  );
}

function DeadlineIconButton({
  icon,
  disabled,
  onPress,
}: {
  icon: 'add' | 'minus';
  disabled: boolean;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.deadlineButton,
        disabled && styles.deadlineButtonDisabled,
        pressed && styles.pressed,
      ]}>
      <Icon
        name={icon}
        size={20}
        color={disabled ? colors.outline : colors.primary}
      />
    </Pressable>
  );
}

function DeadlinePreset({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.preset,
        selected && styles.presetSelected,
        pressed && styles.pressed,
      ]}>
      <AppText
        variant="label"
        color={selected ? 'onPrimary' : 'onSurfaceVariant'}
        weight="700">
        {label}
      </AppText>
    </Pressable>
  );
}

function getSteppedIshaDeadline(
  bounds: IshaDeadlineBounds,
  direction: -1 | 1,
): number {
  if (direction > 0) {
    const nextStep =
      Math.ceil((bounds.resolvedMinutes + 1) / ISHA_DEADLINE_STEP_MINUTES) *
      ISHA_DEADLINE_STEP_MINUTES;

    return Math.min(nextStep, bounds.maximumMinutes);
  }

  const previousStep =
    Math.floor((bounds.resolvedMinutes - 1) / ISHA_DEADLINE_STEP_MINUTES) *
    ISHA_DEADLINE_STEP_MINUTES;

  return Math.max(previousStep, bounds.minimumMinutes);
}

const styles = StyleSheet.create({
  valueCard: {
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceLowest,
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  deadlineControl: {
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceLowest,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  deadlineButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceHigh,
  },
  deadlineButtonDisabled: {
    opacity: 0.45,
  },
  controlText: {
    flex: 1,
    gap: spacing.xs,
  },
  presets: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  preset: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surfaceLowest,
  },
  presetSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  emptyCard: {
    minHeight: 88,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceLowest,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  emptyText: {
    flex: 1,
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
});
