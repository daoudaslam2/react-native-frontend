import React from 'react';
import {
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native';

import type { PrayerLocation } from '../../constants/prayerSettings';

const COMPASS_HEADING_EVENT = 'AlSalahCompassHeadingChanged';

interface CompassHeadingPayload {
  heading?: number;
  accuracy?: number;
}

interface NativeCompassHeadingModule {
  start: (latitude: number, longitude: number) => Promise<boolean>;
  stop: () => Promise<boolean>;
  addListener: (eventName: string) => void;
  removeListeners: (count: number) => void;
}

interface CompassHeadingState {
  heading: number | null;
  accuracy: number | null;
  isAvailable: boolean;
  isStarting: boolean;
  error: string | null;
}

const nativeCompassHeading = NativeModules.AlSalahCompassHeading as
  | NativeCompassHeadingModule
  | undefined;

export function useCompassHeading(
  location: PrayerLocation,
): CompassHeadingState {
  const [state, setState] = React.useState<CompassHeadingState>({
    heading: null,
    accuracy: null,
    isAvailable: Platform.OS === 'android',
    isStarting: Platform.OS === 'android',
    error: null,
  });

  React.useEffect(() => {
    if (Platform.OS !== 'android' || !nativeCompassHeading) {
      setState({
        heading: null,
        accuracy: null,
        isAvailable: false,
        isStarting: false,
        error: 'Compass heading is only available on Android devices.',
      });
      return undefined;
    }

    let isMounted = true;
    const eventEmitter = new NativeEventEmitter(nativeCompassHeading);
    const subscription = eventEmitter.addListener(
      COMPASS_HEADING_EVENT,
      (payload: CompassHeadingPayload) => {
        if (!isMounted || typeof payload.heading !== 'number') {
          return;
        }

        setState({
          heading: payload.heading,
          accuracy:
            typeof payload.accuracy === 'number' ? payload.accuracy : null,
          isAvailable: true,
          isStarting: false,
          error: null,
        });
      },
    );

    setState(current => ({
      ...current,
      heading: null,
      accuracy: null,
      isAvailable: true,
      isStarting: true,
      error: null,
    }));

    nativeCompassHeading
      .start(location.latitude, location.longitude)
      .then(started => {
        if (!isMounted) {
          return;
        }

        setState(current => ({
          ...current,
          isAvailable: started,
          isStarting: false,
          error: started ? null : 'Compass sensor is not available.',
        }));
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setState(current => ({
          ...current,
          isAvailable: false,
          isStarting: false,
          error: 'Could not start the compass sensor.',
        }));
      });

    return () => {
      isMounted = false;
      subscription.remove();
      nativeCompassHeading.stop().catch(() => undefined);
    };
  }, [location.latitude, location.longitude]);

  return state;
}
