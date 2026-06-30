import { NativeModules, Platform } from 'react-native';

export type WidgetPinSize = 'small' | 'medium' | 'large';

type WidgetPinningResult =
  | { requested: true }
  | {
      requested: false;
      reason: 'unsupported-platform' | 'unsupported-launcher' | 'module-unavailable';
    };

interface WidgetPinningNativeModule {
  isPinningSupported(): Promise<boolean>;
  requestPinWidget(widgetSize: WidgetPinSize): Promise<boolean>;
}

const nativeWidgetPinning = NativeModules.AlSalahWidgetPinning as
  | WidgetPinningNativeModule
  | undefined;

export async function requestWidgetPin(
  widgetSize: WidgetPinSize,
): Promise<WidgetPinningResult> {
  if (Platform.OS !== 'android') {
    return { requested: false, reason: 'unsupported-platform' };
  }

  if (!nativeWidgetPinning) {
    return { requested: false, reason: 'module-unavailable' };
  }

  const isSupported = await nativeWidgetPinning.isPinningSupported();

  if (!isSupported) {
    return { requested: false, reason: 'unsupported-launcher' };
  }

  const requested = await nativeWidgetPinning.requestPinWidget(widgetSize);

  return requested
    ? { requested: true }
    : { requested: false, reason: 'unsupported-launcher' };
}
