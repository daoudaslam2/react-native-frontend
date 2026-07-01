import { Coordinates, Qibla } from 'adhan';

const MAKKAH_COORDINATES = {
  latitude: 21.422487,
  longitude: 39.826206,
};

interface CoordinatesValue {
  latitude: number;
  longitude: number;
}

export function normalizeDegrees(value: number): number {
  const normalized = value % 360;

  return normalized < 0 ? normalized + 360 : normalized;
}

export function calculateQiblaDirection({
  latitude,
  longitude,
}: CoordinatesValue): number {
  return Math.round(Qibla(new Coordinates(latitude, longitude)));
}

export function calculateDistanceToMakkahKm({
  latitude,
  longitude,
}: CoordinatesValue): number {
  return Math.round(
    calculateDistanceKm(
      latitude,
      longitude,
      MAKKAH_COORDINATES.latitude,
      MAKKAH_COORDINATES.longitude,
    ),
  );
}

export function getRelativeQiblaDirection({
  qiblaDirection,
  heading,
}: {
  qiblaDirection: number;
  heading: number | null;
}): number {
  if (heading === null) {
    return normalizeDegrees(qiblaDirection);
  }

  return normalizeDegrees(qiblaDirection - heading);
}

export function getShortestAngleToQibla(relativeDirection: number): number {
  const normalized = normalizeDegrees(relativeDirection);

  return normalized > 180 ? 360 - normalized : normalized;
}

export function getQiblaInstruction({
  relativeDirection,
  hasHeading,
}: {
  relativeDirection: number;
  hasHeading: boolean;
}): string {
  if (!hasHeading) {
    return 'Hold your phone flat to start the compass.';
  }

  const normalized = normalizeDegrees(relativeDirection);
  const shortestAngle = getShortestAngleToQibla(normalized);

  if (shortestAngle <= 5) {
    return 'You are facing Qibla.';
  }

  if (normalized <= 180) {
    return `Turn ${Math.round(shortestAngle)}° right.`;
  }

  return `Turn ${Math.round(shortestAngle)}° left.`;
}

function calculateDistanceKm(
  fromLatitude: number,
  fromLongitude: number,
  toLatitude: number,
  toLongitude: number,
): number {
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(toLatitude - fromLatitude);
  const longitudeDelta = toRadians(toLongitude - fromLongitude);
  const firstLatitude = toRadians(fromLatitude);
  const secondLatitude = toRadians(toLatitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;
  const centralAngle =
    2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return earthRadiusKm * centralAngle;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
