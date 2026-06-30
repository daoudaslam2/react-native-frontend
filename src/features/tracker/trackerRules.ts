import { FIXED_PRAYER_LOCATION } from '../../constants/prayerSettings';
import { OBLIGATORY_PRAYERS } from '../../constants/prayers';
import {
  getActivePrayerDate,
  type PrayerCalculationOptions,
} from '../../services/prayer/prayerCalculator';
import type { ObligatoryPrayerKey } from '../../types/prayer';
import { getZonedDateParts } from '../../utils/dateTime';
import type { PrayerLog, PrayerLogStatus } from './trackerStore';

export type PrayerLogs = Record<ObligatoryPrayerKey, PrayerLog>;

type PrayerTrackingOptions = Pick<
  PrayerCalculationOptions,
  'calculationMethod' | 'asrMethod' | 'ishaDeadlineMinutes'
>;

export function createInitialPrayerLogs(): PrayerLogs {
  return {
    fajr: { status: 'pending' },
    dhuhr: { status: 'pending' },
    asr: { status: 'pending' },
    maghrib: { status: 'pending' },
    isha: { status: 'pending' },
  };
}

export function getPrayerTrackingDate(
  now: Date,
  options: PrayerTrackingOptions = {},
): Date {
  return getActivePrayerDate({ ...options, now });
}

export function getPrayerTrackingDateKey(
  now: Date,
  options: PrayerTrackingOptions = {},
): string {
  return formatDateKey(getPrayerTrackingDate(now, options));
}

export function getPreviousPrayerDateKey(now: Date): string {
  return formatDateKey(createDateReference(now, -1));
}

export function isBeforeMissedCutoff(
  now: Date,
  options: PrayerTrackingOptions = {},
): boolean {
  return !isAtOrAfterMissedCutoff(now, options);
}

export function isAtOrAfterMissedCutoff(
  now: Date,
  options: PrayerTrackingOptions = {},
): boolean {
  return (
    getPrayerTrackingDateKey(now, options) ===
    formatDateKey(createDateReference(now, 0))
  );
}

export function formatDateKey(date: Date): string {
  const parts = getZonedDateParts(date, FIXED_PRAYER_LOCATION.timeZone);
  const month = parts.month.toString().padStart(2, '0');
  const day = parts.day.toString().padStart(2, '0');

  return `${parts.year}-${month}-${day}`;
}

export function getAutoMissedPrayers({
  logs,
  dateKey,
  processedMissedKeys,
}: {
  logs?: PrayerLogs;
  dateKey: string;
  processedMissedKeys: Record<string, boolean>;
}): ObligatoryPrayerKey[] {
  if (!logs) {
    return [];
  }

  return OBLIGATORY_PRAYERS.filter(prayer => {
    const processedKey = getProcessedMissedKey(dateKey, prayer);

    return (
      !processedMissedKeys[processedKey] &&
      shouldAutoMarkMissed(logs[prayer].status)
    );
  });
}

export function getProcessedMissedKey(
  dateKey: string,
  prayer: ObligatoryPrayerKey,
): string {
  return `${dateKey}:${prayer}`;
}

export function isPrayerActionable(status: PrayerLogStatus): boolean {
  return status === 'pending' || status === 'upcoming';
}

function shouldAutoMarkMissed(status: PrayerLogStatus): boolean {
  return status === 'pending' || status === 'upcoming';
}

function createDateReference(now: Date, dayOffset: number): Date {
  const parts = getZonedDateParts(now, FIXED_PRAYER_LOCATION.timeZone);

  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day + dayOffset, 12));
}
