import type {
  PrayerSummary,
  PrayerTime,
  PrayerTrackerStats,
} from '../../types/prayer';

const timestamp = '2026-06-29T00:00:00.000Z';

const prayerTimes: PrayerTime[] = [
  {
    id: 'fajr-2026-06-29',
    key: 'fajr',
    name: 'Fajr',
    time: '05:12',
    displayTime: '5:12 AM',
    status: 'completed',
    createdAt: timestamp,
    updatedAt: timestamp,
    syncStatus: 'SYNCED',
  },
  {
    id: 'sunrise-2026-06-29',
    key: 'sunrise',
    name: 'Sunrise',
    time: '06:45',
    displayTime: '6:45 AM',
    status: 'completed',
    createdAt: timestamp,
    updatedAt: timestamp,
    syncStatus: 'SYNCED',
  },
  {
    id: 'dhuhr-2026-06-29',
    key: 'dhuhr',
    name: 'Dhuhr',
    time: '12:58',
    displayTime: '12:58 PM',
    status: 'completed',
    createdAt: timestamp,
    updatedAt: timestamp,
    syncStatus: 'SYNCED',
  },
  {
    id: 'asr-2026-06-29',
    key: 'asr',
    name: 'Asr',
    time: '15:32',
    displayTime: '3:32 PM',
    status: 'current',
    createdAt: timestamp,
    updatedAt: timestamp,
    syncStatus: 'SYNCED',
  },
  {
    id: 'maghrib-2026-06-29',
    key: 'maghrib',
    name: 'Maghrib',
    time: '18:40',
    displayTime: '6:40 PM',
    status: 'upcoming',
    createdAt: timestamp,
    updatedAt: timestamp,
    syncStatus: 'SYNCED',
  },
  {
    id: 'isha-2026-06-29',
    key: 'isha',
    name: 'Isha',
    time: '20:15',
    displayTime: '8:15 PM',
    status: 'upcoming',
    createdAt: timestamp,
    updatedAt: timestamp,
    syncStatus: 'SYNCED',
  },
];

const summary: PrayerSummary = {
  location: 'London, UK',
  hijriDate: "12 Rabi' al-Awwal 1445",
  gregorianDate: 'Mon, Oct 2',
  currentPrayer: 'Asr',
  nextPrayer: 'Maghrib',
  nextPrayerTime: '18:40',
  remainingTime: '01:45:22',
  calculationMethod: 'Muslim World League',
  distanceToMakkahKm: 4795,
  qiblaDirection: 119,
};

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
  getTodayPrayerTimes: () => PrayerTime[];
  getSummary: () => PrayerSummary;
  getTrackerStats: () => PrayerTrackerStats;
}

export const prayerRepository: PrayerRepository = {
  getTodayPrayerTimes: () => prayerTimes,
  getSummary: () => summary,
  getTrackerStats: () => trackerStats,
};
