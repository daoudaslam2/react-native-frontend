import type {
  PrayerSummary,
  PrayerTime,
  PrayerTrackerStats,
} from '../../types/prayer';
import type {
  AsrMethodKey,
  CalculationMethodKey,
} from '../../constants/prayerSettings';
import { calculatePrayerSchedule } from '../prayer/prayerCalculator';

export interface PrayerQueryOptions {
  now?: Date;
  scheduleDate?: Date;
  calculationMethod?: CalculationMethodKey;
  asrMethod?: AsrMethodKey;
}

const trackerStats: PrayerTrackerStats = {
  currentStreakDays: 12,
  monthlyCompletionPercent: 92,
  weeklyCompletion: [
    { day: 'M', percent: 60 },
    { day: 'T', percent: 80 },
    { day: 'W', percent: 100 },
    { day: 'T', percent: 100 },
    { day: 'F', percent: 40 },
    { day: 'S', percent: 70 },
    { day: 'S', percent: 20, isToday: true },
  ],
};

export interface PrayerRepository {
  getTodayPrayerTimes: (options?: PrayerQueryOptions) => PrayerTime[];
  getSummary: (options?: PrayerQueryOptions) => PrayerSummary;
  getTrackerStats: () => PrayerTrackerStats;
}

export const prayerRepository: PrayerRepository = {
  getTodayPrayerTimes: options => calculatePrayerSchedule(options).prayers,
  getSummary: options => calculatePrayerSchedule(options).summary,
  getTrackerStats: () => trackerStats,
};
