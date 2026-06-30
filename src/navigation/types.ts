import type { NavigatorScreenParams } from '@react-navigation/native';

export type MoreStackParamList = {
  MoreHome: undefined;
  Widgets: undefined;
  Qibla: undefined;
  Settings: undefined;
};

export type QazaStackParamList = {
  QazaHome: undefined;
  UpdateQazaCounts: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Tracker: undefined;
  Qaza: NavigatorScreenParams<QazaStackParamList> | undefined;
  More: NavigatorScreenParams<MoreStackParamList> | undefined;
};
