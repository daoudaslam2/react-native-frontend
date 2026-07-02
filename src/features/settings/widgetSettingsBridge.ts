import { NativeModules, Platform } from 'react-native';

import type { PrayerLocation } from '../../constants/prayerSettings';

interface WidgetSettingsNativeModule {
  setIshaDeadlineMinutes?: (minutes: number) => Promise<boolean>;
  clearIshaDeadlineMinutes?: () => Promise<boolean>;
  setUseAdaptiveWidgetColors?: (enabled: boolean) => Promise<boolean>;
  setUseDarkWidgetTheme?: (enabled: boolean) => Promise<boolean>;
  setPrayerLocation?: (
    latitude: number,
    longitude: number,
    label: string,
    timeZone: string,
  ) => Promise<boolean>;
  clearPrayerLocation?: () => Promise<boolean>;
}

const nativeWidgetSettings = NativeModules.AlSalahWidgetPinning as
  | WidgetSettingsNativeModule
  | undefined;

export function syncWidgetIshaDeadlineMinutes(
  minutes: number | null,
): void {
  if (Platform.OS !== 'android' || !nativeWidgetSettings) {
    return;
  }

  const syncPromise =
    minutes === null
      ? nativeWidgetSettings.clearIshaDeadlineMinutes?.()
      : nativeWidgetSettings.setIshaDeadlineMinutes?.(minutes);

  if (syncPromise) {
    syncPromise.catch(() => undefined);
  }
}

export function syncWidgetAdaptiveColorPreference(enabled: boolean): void {
  if (Platform.OS !== 'android' || !nativeWidgetSettings) {
    return;
  }

  const syncPromise =
    nativeWidgetSettings.setUseAdaptiveWidgetColors?.(enabled);

  if (syncPromise) {
    syncPromise.catch(() => undefined);
  }
}

export function syncWidgetDarkThemePreference(enabled: boolean): void {
  if (Platform.OS !== 'android' || !nativeWidgetSettings) {
    return;
  }

  const syncPromise =
    nativeWidgetSettings.setUseDarkWidgetTheme?.(enabled);

  if (syncPromise) {
    syncPromise.catch(() => undefined);
  }
}

export function syncWidgetPrayerLocation(location: PrayerLocation | null): void {
  if (Platform.OS !== 'android' || !nativeWidgetSettings) {
    return;
  }

  const syncPromise = location
    ? nativeWidgetSettings.setPrayerLocation?.(
        location.latitude,
        location.longitude,
        location.label,
        location.timeZone,
      )
    : nativeWidgetSettings.clearPrayerLocation?.();

  if (syncPromise) {
    syncPromise.catch(() => undefined);
  }
}
