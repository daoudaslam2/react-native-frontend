import { FIXED_PRAYER_LOCATION } from '../../constants/prayerSettings';
import { OBLIGATORY_PRAYERS } from '../../constants/prayers';
import type { ObligatoryPrayerKey } from '../../types/prayer';
import { getZonedDateParts, getZonedHour } from '../../utils/dateTime';
import type { PrayerLog, PrayerLogStatus } from './trackerStore';

export type PrayerLogs = Record<ObligatoryPrayerKey, PrayerLog>;

export const MISSED_PRAYER_CUTOFF_HOUR = 2;

export function createInitialPrayerLogs(): PrayerLogs {
  return {
    fajr: { status: 'pending' },
    dhuhr: { status: 'pending' },
    asr: { status: 'pending' },
    maghrib: { status: 'pending' },
    isha: { status: 'pending' },
  };
}

export function getPrayerTrackingDate(now: Date): Date {
  const dayOffset = isBeforeMissedCutoff(now) ? -1 : 0;

  return createDateReference(now, dayOffset);
}

export function getPrayerTrackingDateKey(now: Date): string {
  return formatDateKey(getPrayerTrackingDate(now));
}

export function getPreviousPrayerDateKey(now: Date): string {
  return formatDateKey(createDateReference(now, -1));
}

export function isBeforeMissedCutoff(now: Date): boolean {
  return getZonedHour(now, FIXED_PRAYER_LOCATION.timeZone) <
    MISSED_PRAYER_CUTOFF_HOUR;
}

export function isAtOrAfterMissedCutoff(now: Date): boolean {
  return !isBeforeMissedCutoff(now);
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
