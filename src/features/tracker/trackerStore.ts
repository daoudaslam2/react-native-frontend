import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { localStorage } from '../../storage/mmkv';
import type { ObligatoryPrayerKey } from '../../types/prayer';

export type PrayerLogStatus =
  | 'completed'
  | 'late'
  | 'qaza'
  | 'missed'
  | 'upcoming'
  | 'pending';

export interface PrayerLog {
  status: PrayerLogStatus;
  loggedAt?: string;
}

type PrayerLogs = Record<ObligatoryPrayerKey, PrayerLog>;

interface TrackerState {
  logs: PrayerLogs;
  markPrayer: (prayer: ObligatoryPrayerKey, status: PrayerLogStatus) => void;
}

const initialLogs: PrayerLogs = {
  fajr: { status: 'completed', loggedAt: '2026-06-29T05:20:00.000Z' },
  dhuhr: { status: 'pending' },
  asr: { status: 'upcoming' },
  maghrib: { status: 'upcoming' },
  isha: { status: 'upcoming' },
};

export const useTrackerStore = create<TrackerState>()(
  persist(
    set => ({
      logs: initialLogs,
      markPrayer: (prayer, status) =>
        set(state => ({
          logs: {
            ...state.logs,
            [prayer]: {
              status,
              loggedAt: new Date().toISOString(),
            },
          },
        })),
    }),
    {
      name: 'al-salah-prayer-tracker',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({ logs: state.logs }),
    },
  ),
);
