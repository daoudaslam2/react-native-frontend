import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { localStorage } from '../../storage/mmkv';

export type BackupSyncFrequency =
  | 'appOpen'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'never';

export interface BackupSyncOption {
  key: BackupSyncFrequency;
  label: string;
  description: string;
}

interface BackupSyncValues {
  autoSyncFrequency: BackupSyncFrequency;
  lastSyncAt: string | null;
}

interface BackupSyncState extends BackupSyncValues {
  setAutoSyncFrequency: (frequency: BackupSyncFrequency) => void;
  markSynced: (date?: Date) => void;
}

export const BACKUP_SYNC_OPTIONS: ReadonlyArray<BackupSyncOption> = [
  {
    key: 'appOpen',
    label: 'Every time app opens',
    description: 'Start sync when Al-Salah is opened.',
  },
  {
    key: 'daily',
    label: 'Every day',
    description: 'Sync at most once per day.',
  },
  {
    key: 'weekly',
    label: 'Every week',
    description: 'Sync at most once per week.',
  },
  {
    key: 'monthly',
    label: 'Every month',
    description: 'Sync at most once per month.',
  },
  {
    key: 'never',
    label: 'Never',
    description: 'Only sync when you press Sync Now.',
  },
];

const defaultBackupSyncValues: BackupSyncValues = {
  autoSyncFrequency: 'appOpen',
  lastSyncAt: null,
};

export const useBackupSyncStore = create<BackupSyncState>()(
  persist(
    set => ({
      ...defaultBackupSyncValues,
      setAutoSyncFrequency: autoSyncFrequency => set({ autoSyncFrequency }),
      markSynced: (date = new Date()) =>
        set({ lastSyncAt: date.toISOString() }),
    }),
    {
      name: 'al-salah-backup-sync',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      migrate: persistedState => coercePersistedBackupSync(persistedState),
      partialize: state => ({
        autoSyncFrequency: state.autoSyncFrequency,
        lastSyncAt: state.lastSyncAt,
      }),
    },
  ),
);

export function getBackupSyncFrequencyLabel(
  frequency: BackupSyncFrequency,
): string {
  return (
    BACKUP_SYNC_OPTIONS.find(option => option.key === frequency)?.label ??
    BACKUP_SYNC_OPTIONS[0].label
  );
}

export function shouldAutoSync(
  frequency: BackupSyncFrequency,
  lastSyncAt: string | null,
  now: Date,
): boolean {
  if (frequency === 'never') {
    return false;
  }

  if (!lastSyncAt) {
    return true;
  }

  if (frequency === 'appOpen') {
    return true;
  }

  const lastSyncTime = new Date(lastSyncAt).getTime();

  if (!Number.isFinite(lastSyncTime)) {
    return true;
  }

  const elapsedMs = now.getTime() - lastSyncTime;

  return elapsedMs >= getFrequencyIntervalMs(frequency);
}

function getFrequencyIntervalMs(frequency: BackupSyncFrequency): number {
  switch (frequency) {
    case 'daily':
      return 24 * 60 * 60 * 1000;
    case 'weekly':
      return 7 * 24 * 60 * 60 * 1000;
    case 'monthly':
      return 30 * 24 * 60 * 60 * 1000;
    case 'appOpen':
    case 'never':
      return 0;
  }
}

function coercePersistedBackupSync(
  persistedState: unknown,
): BackupSyncValues {
  if (!isRecord(persistedState)) {
    return defaultBackupSyncValues;
  }

  return {
    autoSyncFrequency: normalizeBackupSyncFrequency(
      persistedState.autoSyncFrequency,
    ),
    lastSyncAt:
      typeof persistedState.lastSyncAt === 'string'
        ? persistedState.lastSyncAt
        : null,
  };
}

function normalizeBackupSyncFrequency(value: unknown): BackupSyncFrequency {
  if (
    typeof value === 'string' &&
    BACKUP_SYNC_OPTIONS.some(option => option.key === value)
  ) {
    return value as BackupSyncFrequency;
  }

  return defaultBackupSyncValues.autoSyncFrequency;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
