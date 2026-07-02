import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../components/AppText';
import { Icon, type IconName } from '../../components/Icon';
import {
  getThemeModeLabel,
  radius,
  spacing,
  useAppTheme,
  useThemeColors,
  type ThemeMode,
} from '../../theme';
import { SettingsDetailScaffold } from './SettingsDetailScaffold';
import { useSettingsStore } from './settingsStore';

type ThemeTarget = 'app' | 'widget';

const themeOptions: readonly ThemeMode[] = ['System', 'Light', 'Dark'];

export function ThemeSettingsScreen(): React.JSX.Element {
  const selectedTheme = useSettingsStore(state => state.theme);
  const selectedWidgetTheme = useSettingsStore(state => state.widgetTheme);
  const setTheme = useSettingsStore(state => state.setTheme);
  const setWidgetTheme = useSettingsStore(state => state.setWidgetTheme);
  const { resolvedTheme } = useAppTheme();
  const [pickerTarget, setPickerTarget] =
    React.useState<ThemeTarget | null>(null);
  const [draftTheme, setDraftTheme] = React.useState<ThemeMode>('System');

  const openPicker = React.useCallback(
    (target: ThemeTarget) => {
      setDraftTheme(target === 'app' ? selectedTheme : selectedWidgetTheme);
      setPickerTarget(target);
    },
    [selectedTheme, selectedWidgetTheme],
  );

  const closePicker = React.useCallback(() => {
    setPickerTarget(null);
  }, []);

  const savePicker = React.useCallback(() => {
    if (pickerTarget === 'app') {
      setTheme(draftTheme);
    }

    if (pickerTarget === 'widget') {
      setWidgetTheme(draftTheme);
    }

    closePicker();
  }, [closePicker, draftTheme, pickerTarget, setTheme, setWidgetTheme]);

  return (
    <SettingsDetailScaffold
      title="Theme"
      subtitle={`Choose how Al-Salah looks. System default is currently ${resolvedTheme}.`}>
      <ThemeRow
        icon="appWindow"
        label="App theme"
        value={getThemeModeLabel(selectedTheme)}
        onPress={() => openPicker('app')}
      />
      <ThemeRow
        icon="widgets"
        label="Widget theme"
        value={getThemeModeLabel(selectedWidgetTheme)}
        onPress={() => openPicker('widget')}
      />
      <ThemePickerModal
        visible={pickerTarget !== null}
        title={pickerTarget === 'widget' ? 'Widget theme' : 'App theme'}
        selectedTheme={draftTheme}
        onSelect={setDraftTheme}
        onCancel={closePicker}
        onConfirm={savePicker}
      />
    </SettingsDetailScaffold>
  );
}

function ThemeRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: IconName;
  label: string;
  value: string;
  onPress: () => void;
}): React.JSX.Element {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && { backgroundColor: colors.surfaceContainer },
      ]}>
      <View style={[styles.rowIcon, { backgroundColor: colors.surfaceHigh }]}>
        <Icon name={icon} color={colors.onSurfaceVariant} />
      </View>
      <View style={styles.rowText}>
        <AppText variant="bodyLarge">{label}</AppText>
        <AppText variant="body" color="onSurfaceVariant" numberOfLines={1}>
          {value}
        </AppText>
      </View>
      <Icon name="chevronRight" color={colors.onSurfaceVariant} />
    </Pressable>
  );
}

function ThemePickerModal({
  visible,
  title,
  selectedTheme,
  onSelect,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  selectedTheme: ThemeMode;
  onSelect: (theme: ThemeMode) => void;
  onCancel: () => void;
  onConfirm: () => void;
}): React.JSX.Element {
  const colors = useThemeColors();

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onCancel}>
      <View style={styles.modalRoot}>
        <Pressable style={styles.modalBackdrop} onPress={onCancel} />
        <View
          style={[
            styles.modalCard,
            { backgroundColor: colors.surfaceLowest },
          ]}>
          <AppText variant="headlineMobile" weight="700">
            {title}
          </AppText>

          <View style={styles.modalOptions}>
            {themeOptions.map(option => {
              const selected = selectedTheme === option;

              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  key={option}
                  onPress={() => onSelect(option)}
                  style={({ pressed }) => [
                    styles.modalOption,
                    pressed && { backgroundColor: colors.surfaceContainer },
                  ]}>
                  <AppText variant="bodyLarge">
                    {getThemeModeLabel(option)}
                  </AppText>
                  <View
                    style={[
                      styles.radio,
                      {
                        borderColor: selected
                          ? colors.primary
                          : colors.outlineVariant,
                      },
                    ]}>
                    {selected ? (
                      <View
                        style={[
                          styles.radioDot,
                          { backgroundColor: colors.primary },
                        ]}
                      />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.modalActions}>
            <Pressable
              accessibilityRole="button"
              onPress={onCancel}
              hitSlop={10}
              style={({ pressed }) => [
                styles.modalAction,
                pressed && styles.pressed,
              ]}>
              <AppText variant="label" color="primary" weight="700">
                Cancel
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onConfirm}
              hitSlop={10}
              style={({ pressed }) => [
                styles.modalAction,
                pressed && styles.pressed,
              ]}>
              <AppText variant="label" color="primary" weight="700">
                OK
              </AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 64,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
  },
  modalCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalOptions: {
    gap: spacing.xs,
  },
  modalOption: {
    minHeight: 48,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
  modalAction: {
    minHeight: 40,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
});
