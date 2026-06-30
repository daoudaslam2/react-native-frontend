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
  | 'qaza'
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
                status: 'qaza',
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
      version: 1,
      storage: createJSONStorage(() => localStorage),
      migrate: persistedState => normalizePersistedTrackerState(persistedState),
      partialize: state => ({
        logsByDate: state.logsByDate,
        processedMissedKeys: state.processedMissedKeys,
      }),
    },
  ),
);

function normalizePersistedTrackerState(persistedState: unknown): Pick<
  TrackerState,
  'logsByDate' | 'processedMissedKeys'
> {
  if (!isRecord(persistedState)) {
    return {
      logsByDate: {},
      processedMissedKeys: {},
    };
  }

  return {
    logsByDate: normalizeLogsByDate(persistedState.logsByDate),
    processedMissedKeys: normalizeProcessedKeys(
      persistedState.processedMissedKeys,
    ),
  };
}

function normalizeLogsByDate(value: unknown): LogsByDate {
  if (!isRecord(value)) {
    return {};
  }

  return Object.entries(value).reduce<LogsByDate>((logsByDate, [dateKey, logs]) => {
    if (!isRecord(logs)) {
      return logsByDate;
    }

    return {
      ...logsByDate,
      [dateKey]: normalizePrayerLogs(logs),
    };
  }, {});
}

function normalizePrayerLogs(value: Record<string, unknown>): PrayerLogs {
  return {
    fajr: normalizePrayerLog(value.fajr),
    dhuhr: normalizePrayerLog(value.dhuhr),
    asr: normalizePrayerLog(value.asr),
    maghrib: normalizePrayerLog(value.maghrib),
    isha: normalizePrayerLog(value.isha),
  };
}

function normalizePrayerLog(value: unknown): PrayerLog {
  if (!isRecord(value)) {
    return { status: 'pending' };
  }

  const status = normalizePrayerLogStatus(value.status);
  const loggedAt = typeof value.loggedAt === 'string' ? value.loggedAt : undefined;

  return loggedAt ? { status, loggedAt } : { status };
}

function normalizePrayerLogStatus(value: unknown): PrayerLogStatus {
  switch (value) {
    case 'completed':
    case 'pending':
    case 'upcoming':
    case 'qaza':
      return value;
    case 'late':
      return 'completed';
    case 'missed':
      return 'qaza';
    default:
      return 'pending';
  }
}

function normalizeProcessedKeys(value: unknown): ProcessedMissedKeys {
  if (!isRecord(value)) {
    return {};
  }

  return Object.entries(value).reduce<ProcessedMissedKeys>(
    (processedKeys, [key, isProcessed]) => ({
      ...processedKeys,
      [key]: isProcessed === true,
    }),
    {},
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
