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
  MAX_ISHA_DEADLINE_MINUTES,
  getCalculationMethodLabel,
  normalizeIshaDeadlineMinutes,
  type AsrMethodKey,
  type CalculationMethodKey,
  type PrayerLocation,
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

export interface PrayerCalculationOptions {
  now?: Date;
  scheduleDate?: Date;
  calculationMethod?: CalculationMethodKey;
  asrMethod?: AsrMethodKey;
  ishaDeadlineMinutes?: number | null;
  location: PrayerLocation;
}

interface PrayerEntry {
  key: PrayerKey;
  date: Date;
}

type DayOffset = -1 | 0 | 1;

interface PrayerWindow {
  key: ObligatoryPrayerKey;
  start: Date;
  end: Date;
  dayOffset: DayOffset;
}

interface PrayerWindowState {
  display: PrayerWindow;
  next: PrayerWindow;
  isPrayerActive: boolean;
  countdownStart: Date;
  countdownEnd: Date;
}

interface PrayerSchedule {
  prayers: PrayerTime[];
  summary: PrayerSummary;
}

type CalculationParameters = ReturnType<typeof CalculationMethod.Karachi>;

export interface IshaDeadlineBounds {
  minimum: Date;
  maximum: Date;
  resolved: Date;
  minimumMinutes: number;
  maximumMinutes: number;
  resolvedMinutes: number;
}

const MAKKAH_COORDINATES = {
  latitude: 21.422487,
  longitude: 39.826206,
};

function createCoordinates(location: PrayerLocation): Coordinates {
  return new Coordinates(location.latitude, location.longitude);
}

export function calculatePrayerSchedule(
  options: PrayerCalculationOptions,
): PrayerSchedule {
  const now = options.now ?? new Date();
  const scheduleDate = options.scheduleDate ?? now;
  const calculationMethod =
    options.calculationMethod ?? DEFAULT_CALCULATION_METHOD;
  const asrMethod = options.asrMethod ?? DEFAULT_ASR_METHOD;
  const location = options.location;
  const coordinates = createCoordinates(location);
  const todayPrayerTimes = createPrayerTimes(
    scheduleDate,
    calculationMethod,
    asrMethod,
    location,
  );
  const yesterdayPrayerTimes = createPrayerTimes(
    scheduleDate,
    calculationMethod,
    asrMethod,
    location,
    -1,
  );
  const tomorrowPrayerTimes = createPrayerTimes(
    scheduleDate,
    calculationMethod,
    asrMethod,
    location,
    1,
  );
  const dayAfterTomorrowPrayerTimes = createPrayerTimes(
    scheduleDate,
    calculationMethod,
    asrMethod,
    location,
    2,
  );

  const todayEntries = createPrayerEntries(todayPrayerTimes);
  const yesterdayEntries = createPrayerEntries(yesterdayPrayerTimes);
  const tomorrowEntries = createPrayerEntries(tomorrowPrayerTimes);
  const dayAfterTomorrowEntries = createPrayerEntries(
    dayAfterTomorrowPrayerTimes,
  );
  const todayWindows = createPrayerWindows(
    todayEntries,
    tomorrowEntries,
    0,
    options.ishaDeadlineMinutes,
    location.timeZone,
  );
  const prayerState = getPrayerWindowState(now, [
    ...createPrayerWindows(
      yesterdayEntries,
      todayEntries,
      -1,
      options.ishaDeadlineMinutes,
      location.timeZone,
    ),
    ...todayWindows,
    ...createPrayerWindows(
      tomorrowEntries,
      dayAfterTomorrowEntries,
      1,
      options.ishaDeadlineMinutes,
      location.timeZone,
    ),
  ]);
  const timestamp = now.toISOString();
  const prayers = todayEntries.map(entry =>
    createPrayerTime(
      entry,
      now,
      prayerState,
      todayWindows,
      timestamp,
      location.timeZone,
    ),
  );

  return {
    prayers,
    summary: {
      location: location.label,
      hijriDate: formatHijriDate(scheduleDate, location.timeZone),
      gregorianDate: formatGregorianDate(
        scheduleDate,
        location.timeZone,
      ),
      currentPrayer: PRAYER_LABELS[prayerState.display.key],
      isPrayerActive: prayerState.isPrayerActive,
      countdownLabel: prayerState.isPrayerActive ? 'Ends in' : 'Starts in',
      countdownStartTime: toPrayerTimeValue(
        prayerState.countdownStart,
        location.timeZone,
      ),
      countdownEndTime: toPrayerTimeValue(
        prayerState.countdownEnd,
        location.timeZone,
      ),
      nextPrayer: PRAYER_LABELS[prayerState.next.key],
      nextPrayerTime: toPrayerTimeValue(
        prayerState.next.start,
        location.timeZone,
      ),
      remainingTime: formatDuration(
        prayerState.countdownEnd.getTime() - now.getTime(),
      ),
      calculationMethod: getCalculationMethodLabel(calculationMethod),
      distanceToMakkahKm: calculateDistanceKm(
        location.latitude,
        location.longitude,
        MAKKAH_COORDINATES.latitude,
        MAKKAH_COORDINATES.longitude,
      ),
      qiblaDirection: Math.round(Qibla(coordinates)),
    },
  };
}

export function getIshaDeadlineBounds(
  options: PrayerCalculationOptions,
): IshaDeadlineBounds {
  const scheduleDate = options.scheduleDate ?? options.now ?? new Date();
  const calculationMethod =
    options.calculationMethod ?? DEFAULT_CALCULATION_METHOD;
  const asrMethod = options.asrMethod ?? DEFAULT_ASR_METHOD;
  const location = options.location;
  const prayerTimes = createPrayerTimes(
    scheduleDate,
    calculationMethod,
    asrMethod,
    location,
  );
  const nextPrayerTimes = createPrayerTimes(
    scheduleDate,
    calculationMethod,
    asrMethod,
    location,
    1,
  );
  const minimum = calculateIslamicMidnight(
    prayerTimes.maghrib,
    nextPrayerTimes.fajr,
  );
  const maximum = createIshaDeadlineDate(
    prayerTimes.isha,
    MAX_ISHA_DEADLINE_MINUTES,
    location.timeZone,
  );
  const minimumMinutes = Math.ceil(
    getDayMinutes(prayerTimes.isha, minimum, location.timeZone),
  );
  const maximumMinutes = MAX_ISHA_DEADLINE_MINUTES;
  const configuredMinutes = normalizeIshaDeadlineMinutes(
    options.ishaDeadlineMinutes,
  );
  const resolved = resolveIshaDeadline(
    prayerTimes.isha,
    prayerTimes.maghrib,
    nextPrayerTimes.fajr,
    configuredMinutes,
    location.timeZone,
  );
  const resolvedMinutes =
    configuredMinutes === null
      ? minimumMinutes
      : clampIshaDeadlineMinutes(
          configuredMinutes,
          minimumMinutes,
          maximumMinutes,
        );

  return {
    minimum,
    maximum,
    resolved,
    minimumMinutes,
    maximumMinutes,
    resolvedMinutes,
  };
}

export function getActivePrayerDate(
  options: PrayerCalculationOptions,
): Date {
  const now = options.now ?? new Date();
  const location = options.location;
  const today = createDateReference(now, 0, location.timeZone);
  const yesterday = createDateReference(now, -1, location.timeZone);
  const previousDeadline = getIshaDeadlineBounds({
    ...options,
    now,
    scheduleDate: yesterday,
  }).resolved;

  return now.getTime() < previousDeadline.getTime() ? yesterday : today;
}

export function getFormattedPrayerTime(
  prayer: ObligatoryPrayerKey,
  use24HourTime: boolean,
  options: PrayerCalculationOptions,
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
  location: PrayerLocation,
  dayOffset = 0,
): PrayerTimes {
  const params = createCalculationParameters(calculationMethod, asrMethod);
  const calculationDate = createCalculationDate(
    date,
    dayOffset,
    location.timeZone,
  );

  return new PrayerTimes(createCoordinates(location), calculationDate, params);
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

function createCalculationDate(
  date: Date,
  dayOffset: number,
  timeZone: string,
): Date {
  const parts = getZonedDateParts(date, timeZone);

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

function createPrayerWindows(
  entries: PrayerEntry[],
  nextDayEntries: PrayerEntry[],
  dayOffset: DayOffset,
  ishaDeadlineMinutes: number | null | undefined,
  timeZone: string,
): PrayerWindow[] {
  const fajr = getPrayerDate(entries, 'fajr');
  const sunrise = getPrayerDate(entries, 'sunrise');
  const dhuhr = getPrayerDate(entries, 'dhuhr');
  const asr = getPrayerDate(entries, 'asr');
  const maghrib = getPrayerDate(entries, 'maghrib');
  const isha = getPrayerDate(entries, 'isha');
  const nextFajr = getPrayerDate(nextDayEntries, 'fajr');

  return [
    { key: 'fajr', start: fajr, end: sunrise, dayOffset },
    { key: 'dhuhr', start: dhuhr, end: asr, dayOffset },
    { key: 'asr', start: asr, end: maghrib, dayOffset },
    { key: 'maghrib', start: maghrib, end: isha, dayOffset },
    {
      key: 'isha',
      start: isha,
      end: resolveIshaDeadline(
        isha,
        maghrib,
        nextFajr,
        ishaDeadlineMinutes,
        timeZone,
      ),
      dayOffset,
    },
  ];
}

function getPrayerWindowState(
  now: Date,
  windows: PrayerWindow[],
): PrayerWindowState {
  const orderedWindows = [...windows].sort(
    (first, second) => first.start.getTime() - second.start.getTime(),
  );
  const nowTime = now.getTime();
  const activeWindow = orderedWindows.find(window => {
    return window.start.getTime() <= nowTime && nowTime < window.end.getTime();
  });
  const nextWindow =
    orderedWindows.find(window => window.start.getTime() > nowTime) ??
    orderedWindows[orderedWindows.length - 1];

  if (activeWindow) {
    return {
      display: activeWindow,
      next: nextWindow,
      isPrayerActive: true,
      countdownStart: activeWindow.start,
      countdownEnd: activeWindow.end,
    };
  }

  const previousWindow = [...orderedWindows]
    .reverse()
    .find(window => window.end.getTime() <= nowTime);

  return {
    display: nextWindow,
    next: nextWindow,
    isPrayerActive: false,
    countdownStart: previousWindow?.end ?? now,
    countdownEnd: nextWindow.start,
  };
}

function createPrayerTime(
  entry: PrayerEntry,
  now: Date,
  prayerState: PrayerWindowState,
  todayWindows: PrayerWindow[],
  timestamp: string,
  timeZone: string,
): PrayerTime {
  const time = toPrayerTimeValue(entry.date, timeZone);
  const status =
    entry.key !== 'sunrise'
      ? getObligatoryPrayerStatus(entry, now, prayerState, todayWindows)
      : entry.date.getTime() < now.getTime()
        ? 'past'
        : 'upcoming';

  return {
    id: `${entry.key}-${formatPrayerDateKey(entry.date, timeZone)}`,
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
  prayerState: PrayerWindowState,
  todayWindows: PrayerWindow[],
): PrayerTime['status'] {
  if (
    prayerState.isPrayerActive &&
    prayerState.display.dayOffset === 0 &&
    prayerState.display.key === entry.key
  ) {
    return 'current';
  }

  if (prayerState.next.dayOffset === 0 && prayerState.next.key === entry.key) {
    return 'next';
  }

  const prayerWindow = todayWindows.find(window => window.key === entry.key);

  if (prayerWindow && prayerWindow.end.getTime() <= now.getTime()) {
    return 'past';
  }

  return 'upcoming';
}

function getPrayerDate(entries: PrayerEntry[], prayer: PrayerKey): Date {
  const entry = entries.find(item => item.key === prayer);

  if (!entry) {
    throw new Error(`Missing ${prayer} prayer time`);
  }

  return entry.date;
}

function calculateIslamicMidnight(maghrib: Date, nextFajr: Date): Date {
  return new Date(maghrib.getTime() + (nextFajr.getTime() - maghrib.getTime()) / 2);
}

function resolveIshaDeadline(
  isha: Date,
  maghrib: Date,
  nextFajr: Date,
  ishaDeadlineMinutes: number | null | undefined,
  timeZone: string,
): Date {
  const minimum = calculateIslamicMidnight(maghrib, nextFajr);
  const maximum = createIshaDeadlineDate(
    isha,
    MAX_ISHA_DEADLINE_MINUTES,
    timeZone,
  );
  const configuredMinutes = normalizeIshaDeadlineMinutes(ishaDeadlineMinutes);

  if (configuredMinutes === null) {
    return minimum;
  }

  const candidate = createIshaDeadlineDate(isha, configuredMinutes, timeZone);

  if (candidate.getTime() < minimum.getTime()) {
    return minimum;
  }

  if (candidate.getTime() > maximum.getTime()) {
    return maximum;
  }

  return candidate;
}

function createIshaDeadlineDate(
  dayDate: Date,
  minutesFromDayStart: number,
  timeZone: string,
): Date {
  const parts = getZonedDateParts(dayDate, timeZone);

  return new Date(
    parts.year,
    parts.month - 1,
    parts.day,
    0,
    minutesFromDayStart,
  );
}

function getDayMinutes(
  dayDate: Date,
  date: Date,
  timeZone: string,
): number {
  const dayStart = createIshaDeadlineDate(dayDate, 0, timeZone);

  return (date.getTime() - dayStart.getTime()) / 60_000;
}

function clampIshaDeadlineMinutes(
  minutes: number,
  minimumMinutes: number,
  maximumMinutes: number,
): number {
  return Math.min(Math.max(minutes, minimumMinutes), maximumMinutes);
}

function createDateReference(
  now: Date,
  dayOffset: number,
  timeZone: string,
): Date {
  const parts = getZonedDateParts(now, timeZone);

  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day + dayOffset, 12));
}

function formatPrayerDateKey(date: Date, timeZone: string): string {
  const parts = getZonedDateParts(date, timeZone);
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
