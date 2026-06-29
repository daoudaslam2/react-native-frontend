import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { localStorage } from '../../storage/mmkv';

interface SettingsState {
  theme: 'System' | 'Light' | 'Dark';
  language: 'English';
  calculationMethod: string;
  asrMethod: string;
  locationMode: string;
  adhanNotifications: boolean;
  qazaReminders: boolean;
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
      adhanNotifications: true,
      qazaReminders: true,
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
