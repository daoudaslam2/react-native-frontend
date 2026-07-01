import { Alert, Linking, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import {
  check,
  PERMISSIONS,
  request,
  RESULTS,
  type Permission,
} from 'react-native-permissions';

export interface DeviceCoordinates {
  latitude: number;
  longitude: number;
}

interface GetPermissionAndLocationOptions {
  showBlockedAlert?: boolean;
}

const LOCATION_TIMEOUT_MS = 15_000;
const LOCATION_MAXIMUM_AGE_MS = 10_000;

const wait = (milliseconds: number): Promise<void> =>
  new Promise(resolve => {
    setTimeout(resolve, milliseconds);
  });

export async function getPermissionAndLocation({
  showBlockedAlert = true,
}: GetPermissionAndLocationOptions = {}): Promise<DeviceCoordinates> {
  const permission = getLocationPermission();

  if (!permission) {
    throw new Error('Location permission is not available on this platform.');
  }

  const permissionResult = await check(permission);

  if (permissionResult === RESULTS.GRANTED) {
    return getCurrentLocation();
  }

  await wait(800);
  return requestLocationPermission(permission, { showBlockedAlert });
}

function getLocationPermission(): Permission | undefined {
  return Platform.select({
    android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
    ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
  });
}

function getCurrentLocation(): Promise<DeviceCoordinates> {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;

        resolve({ latitude, longitude });
      },
      error => {
        reject(error);
      },
      {
        enableHighAccuracy: false,
        timeout: LOCATION_TIMEOUT_MS,
        maximumAge: LOCATION_MAXIMUM_AGE_MS,
      },
    );
  });
}

async function requestLocationPermission(
  permission: Permission,
  { showBlockedAlert }: Required<GetPermissionAndLocationOptions>,
): Promise<DeviceCoordinates> {
  const result = await request(permission);

  if (result === RESULTS.GRANTED) {
    return getCurrentLocation();
  }

  if (
    showBlockedAlert &&
    (result === RESULTS.BLOCKED || result === RESULTS.UNAVAILABLE)
  ) {
    Alert.alert(
      'Location Permissions Disabled',
      'Please enable location permissions for Al-Salah, or enter your coordinates manually.',
      [
        {
          text: 'Open Settings',
          onPress: () => Linking.openSettings(),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
    );
  }

  throw new Error('Location permission denied');
}
