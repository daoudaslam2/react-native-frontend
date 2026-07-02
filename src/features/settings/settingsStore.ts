import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  DEFAULT_ASR_METHOD,
  DEFAULT_CALCULATION_METHOD,
  DEFAULT_ISHA_DEADLINE_MINUTES,
  normalizeAsrMethod,
  normalizeCalculationMethod,
  normalizeIshaDeadlineMinutes,
  normalizePrayerLocation,
  type AsrMethodKey,
  type CalculationMethodKey,
  type PrayerLocation,
} from '../../constants/prayerSettings';
import { localStorage } from '../../storage/mmkv';
import {
  syncWidgetAdaptiveColorPreference,
  syncWidgetIshaDeadlineMinutes,
  syncWidgetPrayerLocation,
} from './widgetSettingsBridge';
import type { ThemeMode } from '../../theme';

export type Language = 'English';

interface SettingsValues {
  theme: ThemeMode;
  language: Language;
  calculationMethod: CalculationMethodKey;
  asrMethod: AsrMethodKey;
  ishaDeadlineMinutes: number | null;
  location: PrayerLocation | null;
  use24HourTime: boolean;
  useAdaptiveWidgetColors: boolean;
  adhanNotifications: boolean;
  qazaReminders: boolean;
}

interface SettingsState extends SettingsValues {
  setTheme: (theme: ThemeMode) => void;
  setLanguage: (language: Language) => void;
  setCalculationMethod: (method: CalculationMethodKey) => void;
  setAsrMethod: (method: AsrMethodKey) => void;
  setIshaDeadlineMinutes: (minutes: number | null) => void;
  setPrayerLocation: (location: PrayerLocation) => void;
  setUseAdaptiveWidgetColors: (enabled: boolean) => void;
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
  location: null,
  use24HourTime: false,
  useAdaptiveWidgetColors: true,
  adhanNotifications: true,
  qazaReminders: true,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    set => ({
      ...defaultSettings,
      setTheme: theme => set({ theme }),
      setLanguage: language => set({ language }),
      setCalculationMethod: calculationMethod => set({ calculationMethod }),
      setAsrMethod: asrMethod => set({ asrMethod }),
      setIshaDeadlineMinutes: minutes => {
        const ishaDeadlineMinutes = normalizeIshaDeadlineMinutes(minutes);

        syncWidgetIshaDeadlineMinutes(ishaDeadlineMinutes);
        set({ ishaDeadlineMinutes });
      },
      setPrayerLocation: location => {
        const normalizedLocation = normalizePrayerLocation(location);

        if (!normalizedLocation) {
          return;
        }

        syncWidgetPrayerLocation(normalizedLocation);
        set({ location: normalizedLocation });
      },
      setUseAdaptiveWidgetColors: useAdaptiveWidgetColors => {
        syncWidgetAdaptiveColorPreference(useAdaptiveWidgetColors);
        set({ useAdaptiveWidgetColors });
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
      version: 6,
      storage: createJSONStorage(() => localStorage),
      migrate: persistedState => coercePersistedSettings(persistedState),
      onRehydrateStorage: () => state => {
        syncWidgetIshaDeadlineMinutes(
          state?.ishaDeadlineMinutes ?? defaultSettings.ishaDeadlineMinutes,
        );
        syncWidgetPrayerLocation(state?.location ?? null);
        syncWidgetAdaptiveColorPreference(
          state?.useAdaptiveWidgetColors ??
            defaultSettings.useAdaptiveWidgetColors,
        );
      },
      partialize: state => ({
        theme: state.theme,
        language: state.language,
        calculationMethod: state.calculationMethod,
        asrMethod: state.asrMethod,
        ishaDeadlineMinutes: state.ishaDeadlineMinutes,
        location: state.location,
        use24HourTime: state.use24HourTime,
        useAdaptiveWidgetColors: state.useAdaptiveWidgetColors,
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
    location: normalizePrayerLocation(persistedState.location),
    use24HourTime: coerceBoolean(
      persistedState.use24HourTime,
      defaultSettings.use24HourTime,
    ),
    useAdaptiveWidgetColors: coerceBoolean(
      persistedState.useAdaptiveWidgetColors,
      defaultSettings.useAdaptiveWidgetColors,
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
