import {
  CalculationMethod,
  Coordinates,
  Madhab,
  PrayerTimes,
  Qibla,
} from 'adhan';

import {
  ASR_METHOD_OPTIONS,
  CALCULATION_METHOD_OPTIONS,
  DEFAULT_ASR_METHOD,
  DEFAULT_CALCULATION_METHOD,
  FIXED_PRAYER_LOCATION,
  getCalculationMethodLabel,
  type AsrMethodKey,
  type CalculationMethodKey,
} from '../../constants/prayerSettings';
import { PRAYER_LABELS } from '../../constants/prayers';
import type {
  ObligatoryPrayerKey,
  PrayerKey,
  PrayerSummary,
  PrayerTime,
} from '../../types/prayer';
import {
  formatDuration,
  formatGregorianDate,
  formatHijriDate,
  formatPrayerTime,
  getZonedDateParts,
  toPrayerTimeValue,
} from '../../utils/dateTime';

interface PrayerCalculationOptions {
  now?: Date;
  scheduleDate?: Date;
  calculationMethod?: CalculationMethodKey;
  asrMethod?: AsrMethodKey;
}

interface PrayerEntry {
  key: PrayerKey;
  date: Date;
}

interface ObligatoryPrayerEntry {
  key: ObligatoryPrayerKey;
  date: Date;
  dayOffset: -1 | 0 | 1;
}

interface PrayerSchedule {
  prayers: PrayerTime[];
  summary: PrayerSummary;
}

type CalculationParameters = ReturnType<typeof CalculationMethod.Karachi>;

const coordinates = new Coordinates(
  FIXED_PRAYER_LOCATION.latitude,
  FIXED_PRAYER_LOCATION.longitude,
);

const MAKKAH_COORDINATES = {
  latitude: 21.422487,
  longitude: 39.826206,
};

export function calculatePrayerSchedule(
  options: PrayerCalculationOptions = {},
): PrayerSchedule {
  const now = options.now ?? new Date();
  const scheduleDate = options.scheduleDate ?? now;
  const calculationMethod =
    options.calculationMethod ?? DEFAULT_CALCULATION_METHOD;
  const asrMethod = options.asrMethod ?? DEFAULT_ASR_METHOD;
  const todayPrayerTimes = createPrayerTimes(
    scheduleDate,
    calculationMethod,
    asrMethod,
  );
  const yesterdayPrayerTimes = createPrayerTimes(
    scheduleDate,
    calculationMethod,
    asrMethod,
    -1,
  );
  const tomorrowPrayerTimes = createPrayerTimes(
    scheduleDate,
    calculationMethod,
    asrMethod,
    1,
  );

  const todayEntries = createPrayerEntries(todayPrayerTimes);
  const yesterdayEntries = createPrayerEntries(yesterdayPrayerTimes);
  const tomorrowEntries = createPrayerEntries(tomorrowPrayerTimes);
  const currentNext = getCurrentNextObligatoryPrayer(
    now,
    yesterdayEntries,
    todayEntries,
    tomorrowEntries,
  );
  const timestamp = now.toISOString();
  const prayers = todayEntries.map(entry =>
    createPrayerTime(entry, now, currentNext, timestamp),
  );

  return {
    prayers,
    summary: {
      location: FIXED_PRAYER_LOCATION.label,
      hijriDate: formatHijriDate(now, FIXED_PRAYER_LOCATION.timeZone),
      gregorianDate: formatGregorianDate(now, FIXED_PRAYER_LOCATION.timeZone),
      currentPrayer: PRAYER_LABELS[currentNext.current.key],
      nextPrayer: PRAYER_LABELS[currentNext.next.key],
      nextPrayerTime: toPrayerTimeValue(
        currentNext.next.date,
        FIXED_PRAYER_LOCATION.timeZone,
      ),
      remainingTime: formatDuration(
        currentNext.next.date.getTime() - now.getTime(),
      ),
      calculationMethod: getCalculationMethodLabel(calculationMethod),
      distanceToMakkahKm: calculateDistanceKm(
        FIXED_PRAYER_LOCATION.latitude,
        FIXED_PRAYER_LOCATION.longitude,
        MAKKAH_COORDINATES.latitude,
        MAKKAH_COORDINATES.longitude,
      ),
      qiblaDirection: Math.round(Qibla(coordinates)),
    },
  };
}

export function getFormattedPrayerTime(
  prayer: ObligatoryPrayerKey,
  use24HourTime: boolean,
  options: PrayerCalculationOptions = {},
): string {
  const prayerTime = calculatePrayerSchedule(options).prayers.find(
    item => item.key === prayer,
  );

  if (!prayerTime) {
    return '';
  }

  return formatPrayerTime(prayerTime.time, use24HourTime);
}

function createPrayerTimes(
  date: Date,
  calculationMethod: CalculationMethodKey,
  asrMethod: AsrMethodKey,
  dayOffset = 0,
): PrayerTimes {
  const params = createCalculationParameters(calculationMethod, asrMethod);
  const calculationDate = createCalculationDate(date, dayOffset);

  return new PrayerTimes(coordinates, calculationDate, params);
}

function createCalculationParameters(
  calculationMethod: CalculationMethodKey,
  asrMethod: AsrMethodKey,
): CalculationParameters {
  const params = getCalculationMethodFactory(calculationMethod)();
  params.madhab = asrMethod === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;

  return params;
}

function getCalculationMethodFactory(
  calculationMethod: CalculationMethodKey,
): () => CalculationParameters {
  switch (calculationMethod) {
    case 'muslimWorldLeague':
      return CalculationMethod.MuslimWorldLeague;
    case 'ummAlQura':
      return CalculationMethod.UmmAlQura;
    case 'moonsightingCommittee':
      return CalculationMethod.MoonsightingCommittee;
    case 'northAmerica':
      return CalculationMethod.NorthAmerica;
    case 'karachi':
      return CalculationMethod.Karachi;
  }
}

function createCalculationDate(date: Date, dayOffset: number): Date {
  const parts = getZonedDateParts(date, FIXED_PRAYER_LOCATION.timeZone);

  return new Date(parts.year, parts.month - 1, parts.day + dayOffset);
}

function createPrayerEntries(prayerTimes: PrayerTimes): PrayerEntry[] {
  return [
    { key: 'fajr', date: prayerTimes.fajr },
    { key: 'sunrise', date: prayerTimes.sunrise },
    { key: 'dhuhr', date: prayerTimes.dhuhr },
    { key: 'asr', date: prayerTimes.asr },
    { key: 'maghrib', date: prayerTimes.maghrib },
    { key: 'isha', date: prayerTimes.isha },
  ];
}

function getCurrentNextObligatoryPrayer(
  now: Date,
  yesterdayEntries: PrayerEntry[],
  todayEntries: PrayerEntry[],
  tomorrowEntries: PrayerEntry[],
): { current: ObligatoryPrayerEntry; next: ObligatoryPrayerEntry } {
  const obligatoryEntries: ObligatoryPrayerEntry[] = [
    {
      key: 'isha',
      date: getPrayerDate(yesterdayEntries, 'isha'),
      dayOffset: -1,
    },
    ...toObligatoryEntries(todayEntries, 0),
    {
      key: 'fajr',
      date: getPrayerDate(tomorrowEntries, 'fajr'),
      dayOffset: 1,
    },
  ];
  const nowTime = now.getTime();
  const current =
    [...obligatoryEntries]
      .reverse()
      .find(entry => entry.date.getTime() <= nowTime) ?? obligatoryEntries[0];
  const next =
    obligatoryEntries.find(entry => entry.date.getTime() > nowTime) ??
    obligatoryEntries[obligatoryEntries.length - 1];

  return { current, next };
}

function toObligatoryEntries(
  entries: PrayerEntry[],
  dayOffset: 0,
): ObligatoryPrayerEntry[] {
  return entries
    .filter((entry): entry is PrayerEntry & { key: ObligatoryPrayerKey } => {
      return entry.key !== 'sunrise';
    })
    .map(entry => ({
      key: entry.key,
      date: entry.date,
      dayOffset,
    }));
}

function createPrayerTime(
  entry: PrayerEntry,
  now: Date,
  currentNext: {
    current: ObligatoryPrayerEntry;
    next: ObligatoryPrayerEntry;
  },
  timestamp: string,
): PrayerTime {
  const time = toPrayerTimeValue(entry.date, FIXED_PRAYER_LOCATION.timeZone);
  const status =
    entry.key !== 'sunrise'
      ? getObligatoryPrayerStatus(entry, now, currentNext)
      : entry.date.getTime() < now.getTime()
        ? 'past'
        : 'upcoming';

  return {
    id: `${entry.key}-${formatPrayerDateKey(entry.date)}`,
    key: entry.key,
    name: PRAYER_LABELS[entry.key],
    time,
    displayTime: formatPrayerTime(time, false),
    status,
    createdAt: timestamp,
    updatedAt: timestamp,
    syncStatus: 'SYNCED',
  };
}

function getObligatoryPrayerStatus(
  entry: PrayerEntry,
  now: Date,
  currentNext: {
    current: ObligatoryPrayerEntry;
    next: ObligatoryPrayerEntry;
  },
): PrayerTime['status'] {
  if (
    currentNext.current.dayOffset === 0 &&
    currentNext.current.key === entry.key
  ) {
    return 'current';
  }

  if (currentNext.next.dayOffset === 0 && currentNext.next.key === entry.key) {
    return 'next';
  }

  return entry.date.getTime() < now.getTime() ? 'past' : 'upcoming';
}

function getPrayerDate(entries: PrayerEntry[], prayer: PrayerKey): Date {
  const entry = entries.find(item => item.key === prayer);

  if (!entry) {
    throw new Error(`Missing ${prayer} prayer time`);
  }

  return entry.date;
}

function formatPrayerDateKey(date: Date): string {
  const parts = getZonedDateParts(date, FIXED_PRAYER_LOCATION.timeZone);
  const month = parts.month.toString().padStart(2, '0');
  const day = parts.day.toString().padStart(2, '0');

  return `${parts.year}-${month}-${day}`;
}

function calculateDistanceKm(
  startLatitude: number,
  startLongitude: number,
  endLatitude: number,
  endLongitude: number,
): number {
  const earthRadiusKm = 6371;
  const deltaLatitude = toRadians(endLatitude - startLatitude);
  const deltaLongitude = toRadians(endLongitude - startLongitude);
  const startLatitudeRadians = toRadians(startLatitude);
  const endLatitudeRadians = toRadians(endLatitude);
  const haversine =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(startLatitudeRadians) *
      Math.cos(endLatitudeRadians) *
      Math.sin(deltaLongitude / 2) ** 2;

  return Math.round(
    earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine)),
  );
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export const prayerCalculationOptions = {
  calculationMethods: CALCULATION_METHOD_OPTIONS,
  asrMethods: ASR_METHOD_OPTIONS,
};
