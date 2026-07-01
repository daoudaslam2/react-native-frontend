export type RootStackParamList = {
  Splash: undefined;
  Login:
    | {
        entry?: AuthEntryPoint;
        returnTo?: AuthReturnRouteName;
      }
    | undefined;
  SignUp:
    | {
        entry?: AuthEntryPoint;
        returnTo?: AuthReturnRouteName;
      }
    | undefined;
  LocationSetup: undefined;
  MainTabs: undefined;
  CalculationMethodSettings: undefined;
  AsrMethodSettings: undefined;
  IshaEndTimeSettings: undefined;
  BackupSync: undefined;
  PrivacyPolicy: undefined;
  About: undefined;
  UpdateQazaCounts: undefined;
  Widgets: undefined;
  Qibla: undefined;
  Settings: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Tracker: undefined;
  Qaza: undefined;
  More: undefined;
};

export type AuthEntryPoint = 'onboarding' | 'backupSync';
export type AuthReturnRouteName = 'BackupSync';
