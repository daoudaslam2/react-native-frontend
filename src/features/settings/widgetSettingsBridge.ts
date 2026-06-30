import { NativeModules, Platform } from 'react-native';

interface WidgetSettingsNativeModule {
  setIshaDeadlineMinutes?: (minutes: number) => Promise<boolean>;
  clearIshaDeadlineMinutes?: () => Promise<boolean>;
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
