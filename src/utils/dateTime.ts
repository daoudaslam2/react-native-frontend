import dayjs from 'dayjs';

const PRAYER_TIME_DATE = '2026-01-01';

export function formatPrayerTime(
  time: string | Date,
  use24HourTime: boolean,
  timeZone?: string,
): string {
  if (time instanceof Date) {
    return formatDateTime(time, use24HourTime, timeZone);
  }

  const parsedTime = parsePrayerTime(time);

  if (!parsedTime.isValid()) {
    return time;
  }

  return parsedTime.format(use24HourTime ? 'HH:mm' : 'h:mm A');
}

export function toPrayerTimeValue(date: Date, timeZone: string): string {
  const parts = getTimeParts(date, timeZone);

  return `${parts.hour}:${parts.minute}`;
}

export function formatDuration(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map(value => value.toString().padStart(2, '0'))
    .join(':');
}

export function formatGregorianDate(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone,
  }).format(date);
}

export function formatHijriDate(date: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone,
    }).format(date);
  } catch {
    return 'Islamic date unavailable';
  }
}

export function getZonedDateParts(
  date: Date,
  timeZone: string,
): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone,
  }).formatToParts(date);

  return {
    year: getNumericPart(parts, 'year'),
    month: getNumericPart(parts, 'month'),
    day: getNumericPart(parts, 'day'),
  };
}

export function getZonedHour(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    hour12: false,
    hourCycle: 'h23',
    timeZone,
  }).formatToParts(date);

  return getNumericPart(parts, 'hour');
}

function parsePrayerTime(time: string): dayjs.Dayjs {
  const trimmedTime = time.trim();
  const timeWithSeconds =
    trimmedTime.length === 5 ? `${trimmedTime}:00` : trimmedTime;

  return dayjs(`${PRAYER_TIME_DATE}T${timeWithSeconds}`);
}

function formatDateTime(
  date: Date,
  use24HourTime: boolean,
  timeZone?: string,
): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: use24HourTime ? '2-digit' : 'numeric',
    minute: '2-digit',
    hour12: !use24HourTime,
    hourCycle: use24HourTime ? 'h23' : undefined,
    timeZone,
  }).format(date);
}

function getTimeParts(
  date: Date,
  timeZone: string,
): { hour: string; minute: string } {
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    hourCycle: 'h23',
    timeZone,
  }).formatToParts(date);

  return {
    hour: getStringPart(parts, 'hour'),
    minute: getStringPart(parts, 'minute'),
  };
}

function getNumericPart(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
): number {
  return Number(getStringPart(parts, type));
}

function getStringPart(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
): string {
  return parts.find(part => part.type === type)?.value ?? '0';
}
