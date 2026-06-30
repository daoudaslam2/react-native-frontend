import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { OBLIGATORY_PRAYERS } from '../../constants/prayers';
import { localStorage } from '../../storage/mmkv';
import type { ObligatoryPrayerKey } from '../../types/prayer';

export type QazaCounts = Record<ObligatoryPrayerKey, number>;

interface QazaState {
  counts: QazaCounts;
  increase: (prayer: ObligatoryPrayerKey) => void;
  decrease: (prayer: ObligatoryPrayerKey) => void;
  completeOne: (prayer: ObligatoryPrayerKey) => void;
  replaceCounts: (counts: QazaCounts) => void;
}

const initialCounts: QazaCounts = {
  fajr: 14,
  dhuhr: 5,
  asr: 2,
  maghrib: 0,
  isha: 8,
};

function updateCount(
  counts: QazaCounts,
  prayer: ObligatoryPrayerKey,
  nextValue: number,
): QazaCounts {
  return {
    ...counts,
    [prayer]: Math.max(0, nextValue),
  };
}

function normalizeCounts(counts: QazaCounts): QazaCounts {
  return OBLIGATORY_PRAYERS.reduce<QazaCounts>(
    (normalized, prayer) => ({
      ...normalized,
      [prayer]: Math.max(0, Math.floor(counts[prayer])),
    }),
    initialCounts,
  );
}

export const useQazaStore = create<QazaState>()(
  persist(
    set => ({
      counts: initialCounts,
      increase: prayer =>
        set(state => ({
          counts: updateCount(state.counts, prayer, state.counts[prayer] + 1),
        })),
      decrease: prayer =>
        set(state => ({
          counts: updateCount(state.counts, prayer, state.counts[prayer] - 1),
        })),
      completeOne: prayer =>
        set(state => ({
          counts: updateCount(state.counts, prayer, state.counts[prayer] - 1),
        })),
      replaceCounts: counts =>
        set(() => ({
          counts: normalizeCounts(counts),
        })),
    }),
    {
      name: 'al-salah-qaza-counts',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({ counts: state.counts }),
    },
  ),
);

export function getTotalQaza(counts: QazaCounts): number {
  return OBLIGATORY_PRAYERS.reduce((total, prayer) => total + counts[prayer], 0);
}
