import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { localStorage } from '../../storage/mmkv';
import type { ObligatoryPrayerKey } from '../../types/prayer';
import {
  createInitialPrayerLogs,
  getProcessedMissedKey,
  type PrayerLogs,
} from './trackerRules';

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

type LogsByDate = Record<string, PrayerLogs>;
type ProcessedMissedKeys = Record<string, boolean>;

interface TrackerState {
  logsByDate: LogsByDate;
  processedMissedKeys: ProcessedMissedKeys;
  ensurePrayerDate: (dateKey: string) => void;
  markPrayer: (
    dateKey: string,
    prayer: ObligatoryPrayerKey,
    status: PrayerLogStatus,
  ) => void;
  markMissedForQaza: (
    dateKey: string,
    prayer: ObligatoryPrayerKey,
  ) => boolean;
}

export const useTrackerStore = create<TrackerState>()(
  persist(
    (set, get) => ({
      logsByDate: {},
      processedMissedKeys: {},
      ensurePrayerDate: dateKey =>
        set(state => ({
          logsByDate: {
            ...state.logsByDate,
            [dateKey]: state.logsByDate[dateKey] ?? createInitialPrayerLogs(),
          },
        })),
      markPrayer: (dateKey, prayer, status) =>
        set(state => ({
          logsByDate: {
            ...state.logsByDate,
            [dateKey]: {
              ...(state.logsByDate[dateKey] ?? createInitialPrayerLogs()),
              [prayer]: {
                status,
                loggedAt: new Date().toISOString(),
              },
            },
          },
        })),
      markMissedForQaza: (dateKey, prayer) => {
        const processedKey = getProcessedMissedKey(dateKey, prayer);
        const state = get();

        if (state.processedMissedKeys[processedKey]) {
          return false;
        }

        set(currentState => ({
          logsByDate: {
            ...currentState.logsByDate,
            [dateKey]: {
              ...(currentState.logsByDate[dateKey] ??
                createInitialPrayerLogs()),
              [prayer]: {
                status: 'missed',
                loggedAt: new Date().toISOString(),
              },
            },
          },
          processedMissedKeys: {
            ...currentState.processedMissedKeys,
            [processedKey]: true,
          },
        }));

        return true;
      },
    }),
    {
      name: 'al-salah-prayer-tracker-v3',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({
        logsByDate: state.logsByDate,
        processedMissedKeys: state.processedMissedKeys,
      }),
    },
  ),
);
