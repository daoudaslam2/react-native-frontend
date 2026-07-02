import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { OBLIGATORY_PRAYERS } from '../../constants/prayers';
import { localStorage } from '../../storage/mmkv';
import type { ObligatoryPrayerKey } from '../../types/prayer';

export type IshaQazaPart = 'fardh' | 'witr';

export type QazaCounterKey =
  | 'fajr_fardh'
  | 'dhuhr_fardh'
  | 'asr_fardh'
  | 'maghrib_fardh'
  | 'isha_fardh'
  | 'isha_witr';

export type QazaCounts = Record<QazaCounterKey, number>;

export interface IshaPartCounts {
  fardh: number;
  witr: number;
}

interface LegacyQazaCounts {
  fajr: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
}

interface QazaState {
  counts: QazaCounts;
  ishaSplitEnabled: boolean;
  increase: (prayer: ObligatoryPrayerKey) => void;
  decrease: (prayer: ObligatoryPrayerKey) => void;
  completeOne: (prayer: ObligatoryPrayerKey, part?: IshaQazaPart) => void;
  addMissed: (prayer: ObligatoryPrayerKey) => void;
  replaceCounts: (counts: QazaCounts, ishaSplitEnabled?: boolean) => void;
  setIshaSplitEnabled: (enabled: boolean) => void;
}

const QAZA_COUNTER_KEYS: ReadonlyArray<QazaCounterKey> = [
  'fajr_fardh',
  'dhuhr_fardh',
  'asr_fardh',
  'maghrib_fardh',
  'isha_fardh',
  'isha_witr',
];

const FARDH_COUNTER_KEYS: Record<ObligatoryPrayerKey, QazaCounterKey> = {
  fajr: 'fajr_fardh',
  dhuhr: 'dhuhr_fardh',
  asr: 'asr_fardh',
  maghrib: 'maghrib_fardh',
  isha: 'isha_fardh',
};

const ISHA_COUNTER_KEYS: Record<IshaQazaPart, QazaCounterKey> = {
  fardh: 'isha_fardh',
  witr: 'isha_witr',
};

const initialCounts: QazaCounts = createEmptyQazaCounts();

export const useQazaStore = create<QazaState>()(
  persist(
    (set, get) => ({
      counts: initialCounts,
      ishaSplitEnabled: false,
      increase: prayer =>
        set(state => ({
          counts: updatePrayerCount(state, prayer, 1),
        })),
      decrease: prayer =>
        set(state => ({
          counts: updatePrayerCount(state, prayer, -1),
        })),
      completeOne: (prayer, part) =>
        set(state => ({
          counts: completePrayerQaza(state, prayer, part),
        })),
      addMissed: prayer =>
        set(state => ({
          counts: updatePrayerCount(state, prayer, 1),
        })),
      replaceCounts: (counts, ishaSplitEnabled = false) =>
        set(() => replaceQazaCounts(counts, ishaSplitEnabled)),
      setIshaSplitEnabled: enabled => {
        const state = get();

        if (!enabled && !canTurnOffIshaSplit(state.counts)) {
          return;
        }

        set({
          ishaSplitEnabled: enabled,
          counts: enabled ? state.counts : syncCombinedIshaCounts(state.counts),
        });
      },
    }),
    {
      name: 'al-salah-qaza-counts-v2',
      version: 3,
      storage: createJSONStorage(() => localStorage),
      migrate: persistedState => normalizePersistedQazaState(persistedState),
      partialize: state => ({
        counts: state.counts,
        ishaSplitEnabled: state.ishaSplitEnabled,
      }),
    },
  ),
);

export function createEmptyQazaCounts(): QazaCounts {
  return {
    fajr_fardh: 0,
    dhuhr_fardh: 0,
    asr_fardh: 0,
    maghrib_fardh: 0,
    isha_fardh: 0,
    isha_witr: 0,
  };
}

export function getPrayerQazaCount(
  counts: QazaCounts,
  prayer: ObligatoryPrayerKey,
): number {
  if (prayer === 'isha') {
    return getCombinedIshaCount(counts);
  }

  return counts[FARDH_COUNTER_KEYS[prayer]];
}

export function getIshaPartCounts(counts: QazaCounts): IshaPartCounts {
  return {
    fardh: counts.isha_fardh,
    witr: counts.isha_witr,
  };
}

export function getTotalQaza(
  counts: QazaCounts,
  ishaSplitEnabled = false,
): number {
  return OBLIGATORY_PRAYERS.reduce((total, prayer) => {
    if (prayer !== 'isha') {
      return total + getPrayerQazaCount(counts, prayer);
    }

    return total + (
      ishaSplitEnabled
        ? counts.isha_fardh + counts.isha_witr
        : getCombinedIshaCount(counts)
    );
  }, 0);
}

export function canTurnOffIshaSplit(counts: QazaCounts): boolean {
  return counts.isha_fardh === counts.isha_witr;
}

function updatePrayerCount(
  state: Pick<QazaState, 'counts'>,
  prayer: ObligatoryPrayerKey,
  delta: number,
): QazaCounts {
  if (prayer !== 'isha') {
    return updateCounter(
      state.counts,
      FARDH_COUNTER_KEYS[prayer],
      state.counts[FARDH_COUNTER_KEYS[prayer]] + delta,
    );
  }

  return updateIshaTogether(state.counts, delta);
}

function completePrayerQaza(
  state: Pick<QazaState, 'counts' | 'ishaSplitEnabled'>,
  prayer: ObligatoryPrayerKey,
  part?: IshaQazaPart,
): QazaCounts {
  if (prayer !== 'isha') {
    return updatePrayerCount(state, prayer, -1);
  }

  if (!state.ishaSplitEnabled || !part) {
    return updateIshaTogether(state.counts, -1);
  }

  const key = ISHA_COUNTER_KEYS[part];

  return updateCounter(state.counts, key, state.counts[key] - 1);
}

function replaceQazaCounts(
  counts: QazaCounts,
  ishaSplitEnabled: boolean,
): Pick<QazaState, 'counts' | 'ishaSplitEnabled'> {
  const normalizedCounts = normalizeCounts(counts);

  return {
    counts: ishaSplitEnabled
      ? normalizedCounts
      : syncCombinedIshaCounts(normalizedCounts),
    ishaSplitEnabled,
  };
}

function updateIshaTogether(counts: QazaCounts, delta: number): QazaCounts {
  return {
    ...counts,
    isha_fardh: normalizeCount(counts.isha_fardh + delta),
    isha_witr: normalizeCount(counts.isha_witr + delta),
  };
}

function updateCounter(
  counts: QazaCounts,
  key: QazaCounterKey,
  nextValue: number,
): QazaCounts {
  return {
    ...counts,
    [key]: normalizeCount(nextValue),
  };
}

function syncCombinedIshaCounts(counts: QazaCounts): QazaCounts {
  const combinedCount = getCombinedIshaCount(counts);

  return {
    ...counts,
    isha_fardh: combinedCount,
    isha_witr: combinedCount,
  };
}

function getCombinedIshaCount(counts: QazaCounts): number {
  return Math.max(counts.isha_fardh, counts.isha_witr);
}

function normalizeCounts(counts: QazaCounts): QazaCounts {
  return QAZA_COUNTER_KEYS.reduce<QazaCounts>(
    (normalized, key) => ({
      ...normalized,
      [key]: normalizeCount(counts[key]),
    }),
    initialCounts,
  );
}

function normalizeCount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function normalizePersistedQazaState(persistedState: unknown): Pick<
  QazaState,
  'counts' | 'ishaSplitEnabled'
> {
  if (!isRecord(persistedState)) {
    return {
      counts: initialCounts,
      ishaSplitEnabled: false,
    };
  }

  const counts = readPersistedCounts(persistedState);
  const ishaSplitEnabled = persistedState.ishaSplitEnabled === true;

  return replaceQazaCounts(counts, ishaSplitEnabled);
}

function readPersistedCounts(
  persistedState: Record<string, unknown>,
): QazaCounts {
  if (isQazaCounts(persistedState.counts)) {
    return normalizeCounts(persistedState.counts);
  }

  if (isLegacyQazaCounts(persistedState.counts)) {
    return migrateLegacyCounts(
      persistedState.counts,
      persistedState.ishaSplitCounts,
    );
  }

  return initialCounts;
}

function migrateLegacyCounts(
  counts: LegacyQazaCounts,
  persistedIshaSplitCounts: unknown,
): QazaCounts {
  const ishaCounts = isLegacyIshaPartCounts(persistedIshaSplitCounts)
    ? persistedIshaSplitCounts
    : {
        fardh: counts.isha,
        witr: counts.isha,
      };

  return normalizeCounts({
    fajr_fardh: counts.fajr,
    dhuhr_fardh: counts.dhuhr,
    asr_fardh: counts.asr,
    maghrib_fardh: counts.maghrib,
    isha_fardh: ishaCounts.fardh,
    isha_witr: ishaCounts.witr,
  });
}

function isQazaCounts(value: unknown): value is QazaCounts {
  if (!isRecord(value)) {
    return false;
  }

  return QAZA_COUNTER_KEYS.every(key => typeof value[key] === 'number');
}

function isLegacyQazaCounts(value: unknown): value is LegacyQazaCounts {
  if (!isRecord(value)) {
    return false;
  }

  return OBLIGATORY_PRAYERS.every(prayer => typeof value[prayer] === 'number');
}

function isLegacyIshaPartCounts(value: unknown): value is IshaPartCounts {
  return (
    isRecord(value) &&
    typeof value.fardh === 'number' &&
    typeof value.witr === 'number'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
