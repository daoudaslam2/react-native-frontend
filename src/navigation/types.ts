import type { NavigatorScreenParams } from '@react-navigation/native';

export type MoreStackParamList = {
  MoreHome: undefined;
  Qibla: undefined;
  PrayerTracker: undefined;
  Settings: undefined;
};

export type QazaStackParamList = {
  QazaHome: undefined;
  UpdateQazaCounts: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  PrayerTimes: undefined;
  Qaza: NavigatorScreenParams<QazaStackParamList> | undefined;
  More: NavigatorScreenParams<MoreStackParamList> | undefined;
};
