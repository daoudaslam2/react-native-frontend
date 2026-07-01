export type CalculationMethodKey =
  | 'karachi'
  | 'muslimWorldLeague'
  | 'ummAlQura'
  | 'moonsightingCommittee'
  | 'northAmerica';

export type AsrMethodKey = 'hanafi' | 'standard';
export type PrayerLocationSource = 'device' | 'manual';

export interface PrayerLocation {
  label: string;
  latitude: number;
  longitude: number;
  timeZone: string;
  source: PrayerLocationSource;
}

export interface PrayerSettingOption<T extends string> {
  key: T;
  label: string;
  description: string;
}

export const DEFAULT_CALCULATION_METHOD: CalculationMethodKey = 'karachi';
export const DEFAULT_ASR_METHOD: AsrMethodKey = 'hanafi';
export const DEFAULT_ISHA_DEADLINE_MINUTES: number | null = null;
export const ISHA_DEADLINE_STEP_MINUTES = 15;
export const MAX_ISHA_DEADLINE_MINUTES = 26 * 60;
const FALLBACK_TIME_ZONE = 'UTC';

export const CALCULATION_METHOD_OPTIONS: ReadonlyArray<
  PrayerSettingOption<CalculationMethodKey>
> = [
  {
    key: 'karachi',
    label: 'Karachi',
    description: 'University of Islamic Sciences, Karachi',
  },
  {
    key: 'muslimWorldLeague',
    label: 'Muslim World League',
    description: 'MWL standard calculation',
  },
  {
    key: 'ummAlQura',
    label: 'Umm al-Qura',
    description: 'Makkah-based method',
  },
  {
    key: 'moonsightingCommittee',
    label: 'Moonsighting Committee',
    description: 'Moonsighting Committee Worldwide',
  },
  {
    key: 'northAmerica',
    label: 'North America',
    description: 'ISNA method',
  },
];

export const ASR_METHOD_OPTIONS: ReadonlyArray<
  PrayerSettingOption<AsrMethodKey>
> = [
  {
    key: 'hanafi',
    label: 'Hanafi',
    description: 'Later Asr shadow calculation',
  },
  {
    key: 'standard',
    label: 'Standard',
    description: 'Shafii, Hanbali, Maliki',
  },
];

export function getCalculationMethodLabel(
  method: CalculationMethodKey,
): string {
  return (
    CALCULATION_METHOD_OPTIONS.find(option => option.key === method)?.label ??
    CALCULATION_METHOD_OPTIONS[0].label
  );
}

export function getAsrMethodLabel(method: AsrMethodKey): string {
  return (
    ASR_METHOD_OPTIONS.find(option => option.key === method)?.label ??
    ASR_METHOD_OPTIONS[0].label
  );
}

export function normalizeCalculationMethod(
  value: unknown,
): CalculationMethodKey {
  if (value === 'Muslim World League (MWL)') {
    return DEFAULT_CALCULATION_METHOD;
  }

  if (
    typeof value === 'string' &&
    CALCULATION_METHOD_OPTIONS.some(option => option.key === value)
  ) {
    return value as CalculationMethodKey;
  }

  return DEFAULT_CALCULATION_METHOD;
}

export function normalizeAsrMethod(value: unknown): AsrMethodKey {
  if (value === 'Standard (Shafii, Hanbali, Maliki)') {
    return DEFAULT_ASR_METHOD;
  }

  if (
    typeof value === 'string' &&
    ASR_METHOD_OPTIONS.some(option => option.key === value)
  ) {
    return value as AsrMethodKey;
  }

  return DEFAULT_ASR_METHOD;
}

export function normalizeIshaDeadlineMinutes(value: unknown): number | null {
  if (value === null || value === undefined) {
    return DEFAULT_ISHA_DEADLINE_MINUTES;
  }

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_ISHA_DEADLINE_MINUTES;
  }

  return Math.min(
    Math.max(Math.round(value), 0),
    MAX_ISHA_DEADLINE_MINUTES,
  );
}

export function getDeviceTimeZone(): string {
  return (
    Intl.DateTimeFormat().resolvedOptions().timeZone ||
    FALLBACK_TIME_ZONE
  );
}

export function formatCoordinatesLabel(location: PrayerLocation): string {
  return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
}

export function formatPrayerLocationLabel(location: PrayerLocation): string {
  return `${location.label} (${formatCoordinatesLabel(location)})`;
}

export function createDevicePrayerLocation({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}): PrayerLocation {
  return {
    label: 'Current location',
    latitude,
    longitude,
    timeZone: getDeviceTimeZone(),
    source: 'device',
  };
}

export function createManualPrayerLocation({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}): PrayerLocation {
  return {
    label: 'Manual location',
    latitude,
    longitude,
    timeZone: getDeviceTimeZone(),
    source: 'manual',
  };
}

export function normalizePrayerLocation(
  value: unknown,
): PrayerLocation | null {
  if (!isRecord(value)) {
    return null;
  }

  const latitude = normalizeLatitude(value.latitude);
  const longitude = normalizeLongitude(value.longitude);
  const source = value.source === 'device' ? 'device' : 'manual';
  const label =
    typeof value.label === 'string' && value.label.trim()
      ? value.label.trim()
      : source === 'device'
        ? 'Current location'
        : 'Manual location';
  const timeZone =
    typeof value.timeZone === 'string' && value.timeZone.trim()
      ? value.timeZone.trim()
      : getDeviceTimeZone();

  if (latitude === null || longitude === null) {
    return null;
  }

  return {
    label,
    latitude,
    longitude,
    timeZone,
    source,
  };
}

export function normalizeLatitude(value: unknown): number | null {
  const parsed = typeof value === 'string' ? Number(value) : value;

  if (typeof parsed !== 'number' || !Number.isFinite(parsed)) {
    return null;
  }

  return parsed >= -90 && parsed <= 90 ? parsed : null;
}

export function normalizeLongitude(value: unknown): number | null {
  const parsed = typeof value === 'string' ? Number(value) : value;

  if (typeof parsed !== 'number' || !Number.isFinite(parsed)) {
    return null;
  }

  return parsed >= -180 && parsed <= 180 ? parsed : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
