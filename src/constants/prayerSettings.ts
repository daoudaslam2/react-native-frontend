export type CalculationMethodKey =
  | 'karachi'
  | 'muslimWorldLeague'
  | 'ummAlQura'
  | 'moonsightingCommittee'
  | 'northAmerica';

export type AsrMethodKey = 'hanafi' | 'standard';

export interface PrayerSettingOption<T extends string> {
  key: T;
  label: string;
  description: string;
}

export const DEFAULT_CALCULATION_METHOD: CalculationMethodKey = 'karachi';
export const DEFAULT_ASR_METHOD: AsrMethodKey = 'hanafi';

export const FIXED_PRAYER_LOCATION = {
  label: 'Lahore, Pakistan',
  coordinatesLabel: '31.502480, 74.321451',
  latitude: 31.50248,
  longitude: 74.321451,
  timeZone: 'Asia/Karachi',
} as const;

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
