export type SyncStatus = 'PENDING' | 'SYNCED' | 'FAILED';

export type PrayerKey =
  | 'fajr'
  | 'sunrise'
  | 'dhuhr'
  | 'asr'
  | 'maghrib'
  | 'isha';

export type ObligatoryPrayerKey = Exclude<PrayerKey, 'sunrise'>;

export type PrayerStatus = 'past' | 'current' | 'next' | 'upcoming';

export interface SyncableEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface PrayerTime extends SyncableEntity {
  key: PrayerKey;
  name: string;
  time: string;
  displayTime: string;
  status: PrayerStatus;
}

export interface PrayerSummary {
  location: string;
  hijriDate: string;
  gregorianDate: string;
  currentPrayer: string;
  isPrayerActive: boolean;
  countdownLabel: string;
  countdownStartTime: string;
  countdownEndTime: string;
  nextPrayer: string;
  nextPrayerTime: string;
  remainingTime: string;
  calculationMethod: string;
  distanceToMakkahKm: number;
  qiblaDirection: number;
}

export interface PrayerTrackerStats {
  currentStreakDays: number;
  monthlyCompletionPercent: number;
  weeklyCompletion: ReadonlyArray<{
    day: string;
    percent: number;
    isToday?: boolean;
  }>;
}
