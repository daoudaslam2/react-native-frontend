import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { localStorage } from '../../storage/mmkv';

interface SettingsState {
  theme: 'System' | 'Light' | 'Dark';
  language: 'English';
  calculationMethod: string;
  asrMethod: string;
  locationMode: string;
  use24HourTime: boolean;
  adhanNotifications: boolean;
  qazaReminders: boolean;
  toggleUse24HourTime: () => void;
  toggleAdhanNotifications: () => void;
  toggleQazaReminders: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    set => ({
      theme: 'System',
      language: 'English',
      calculationMethod: 'Muslim World League (MWL)',
      asrMethod: 'Standard (Shafii, Hanbali, Maliki)',
      locationMode: 'Auto (Current Location)',
      use24HourTime: false,
      adhanNotifications: true,
      qazaReminders: true,
      toggleUse24HourTime: () =>
        set(state => ({ use24HourTime: !state.use24HourTime })),
      toggleAdhanNotifications: () =>
        set(state => ({ adhanNotifications: !state.adhanNotifications })),
      toggleQazaReminders: () =>
        set(state => ({ qazaReminders: !state.qazaReminders })),
    }),
    {
      name: 'al-salah-settings',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
