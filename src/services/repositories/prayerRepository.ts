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
  currentStreakDays: 0,
  monthlyCompletionPercent: 0,
  weeklyCompletion: [],
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
