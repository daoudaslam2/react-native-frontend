import type { NavigatorScreenParams } from '@react-navigation/native';

export type TrackerStackParamList = {
  PrayerTracker: undefined;
  Qaza: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  PrayerTimes: undefined;
  Qibla: undefined;
  TrackerStack: NavigatorScreenParams<TrackerStackParamList> | undefined;
  Settings: undefined;
};
