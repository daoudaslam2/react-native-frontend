import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  DEFAULT_ASR_METHOD,
  DEFAULT_CALCULATION_METHOD,
  DEFAULT_ISHA_DEADLINE_MINUTES,
  FIXED_PRAYER_LOCATION,
  normalizeAsrMethod,
  normalizeCalculationMethod,
  normalizeIshaDeadlineMinutes,
  type AsrMethodKey,
  type CalculationMethodKey,
} from '../../constants/prayerSettings';
import { localStorage } from '../../storage/mmkv';
import { syncWidgetIshaDeadlineMinutes } from './widgetSettingsBridge';

type ThemeMode = 'System' | 'Light' | 'Dark';
type Language = 'English';

interface SettingsValues {
  theme: ThemeMode;
  language: Language;
  calculationMethod: CalculationMethodKey;
  asrMethod: AsrMethodKey;
  ishaDeadlineMinutes: number | null;
  locationMode: string;
  use24HourTime: boolean;
  adhanNotifications: boolean;
  qazaReminders: boolean;
}

interface SettingsState extends SettingsValues {
  setCalculationMethod: (method: CalculationMethodKey) => void;
  setAsrMethod: (method: AsrMethodKey) => void;
  setIshaDeadlineMinutes: (minutes: number | null) => void;
  toggleUse24HourTime: () => void;
  toggleAdhanNotifications: () => void;
  toggleQazaReminders: () => void;
}

const defaultSettings: SettingsValues = {
  theme: 'System',
  language: 'English',
  calculationMethod: DEFAULT_CALCULATION_METHOD,
  asrMethod: DEFAULT_ASR_METHOD,
  ishaDeadlineMinutes: DEFAULT_ISHA_DEADLINE_MINUTES,
  locationMode: `${FIXED_PRAYER_LOCATION.label} (${FIXED_PRAYER_LOCATION.coordinatesLabel})`,
  use24HourTime: false,
  adhanNotifications: true,
  qazaReminders: true,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    set => ({
      ...defaultSettings,
      setCalculationMethod: calculationMethod => set({ calculationMethod }),
      setAsrMethod: asrMethod => set({ asrMethod }),
      setIshaDeadlineMinutes: minutes => {
        const ishaDeadlineMinutes = normalizeIshaDeadlineMinutes(minutes);

        syncWidgetIshaDeadlineMinutes(ishaDeadlineMinutes);
        set({ ishaDeadlineMinutes });
      },
      toggleUse24HourTime: () =>
        set(state => ({ use24HourTime: !state.use24HourTime })),
      toggleAdhanNotifications: () =>
        set(state => ({ adhanNotifications: !state.adhanNotifications })),
      toggleQazaReminders: () =>
        set(state => ({ qazaReminders: !state.qazaReminders })),
    }),
    {
      name: 'al-salah-settings',
      version: 3,
      storage: createJSONStorage(() => localStorage),
      migrate: persistedState => coercePersistedSettings(persistedState),
      onRehydrateStorage: () => state => {
        syncWidgetIshaDeadlineMinutes(
          state?.ishaDeadlineMinutes ?? defaultSettings.ishaDeadlineMinutes,
        );
      },
      partialize: state => ({
        theme: state.theme,
        language: state.language,
        calculationMethod: state.calculationMethod,
        asrMethod: state.asrMethod,
        ishaDeadlineMinutes: state.ishaDeadlineMinutes,
        locationMode: state.locationMode,
        use24HourTime: state.use24HourTime,
        adhanNotifications: state.adhanNotifications,
        qazaReminders: state.qazaReminders,
      }),
    },
  ),
);

function coercePersistedSettings(persistedState: unknown): SettingsValues {
  if (!isRecord(persistedState)) {
    return defaultSettings;
  }

  return {
    theme: coerceTheme(persistedState.theme),
    language: 'English',
    calculationMethod: normalizeCalculationMethod(
      persistedState.calculationMethod,
    ),
    asrMethod: normalizeAsrMethod(persistedState.asrMethod),
    ishaDeadlineMinutes: normalizeIshaDeadlineMinutes(
      persistedState.ishaDeadlineMinutes,
    ),
    locationMode: defaultSettings.locationMode,
    use24HourTime: coerceBoolean(
      persistedState.use24HourTime,
      defaultSettings.use24HourTime,
    ),
    adhanNotifications: coerceBoolean(
      persistedState.adhanNotifications,
      defaultSettings.adhanNotifications,
    ),
    qazaReminders: coerceBoolean(
      persistedState.qazaReminders,
      defaultSettings.qazaReminders,
    ),
  };
}

function coerceTheme(value: unknown): ThemeMode {
  if (value === 'System' || value === 'Light' || value === 'Dark') {
    return value;
  }

  return defaultSettings.theme;
}

function coerceBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
