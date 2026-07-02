import {
  DEFAULT_ASR_METHOD,
  DEFAULT_CALCULATION_METHOD,
  DEFAULT_ISHA_DEADLINE_MINUTES,
} from '../../constants/prayerSettings';
import { clearLocalDatabase } from '../../database/database';
import { useAuthStore } from '../../features/auth/authStore';
import {
  createEmptyQazaCounts,
  useQazaStore,
} from '../../features/qaza/qazaStore';
import { useBackupSyncStore } from '../../features/settings/backupSyncStore';
import { useSettingsStore } from '../../features/settings/settingsStore';
import {
  syncWidgetAdaptiveColorPreference,
  syncWidgetDarkThemePreference,
  syncWidgetIshaDeadlineMinutes,
  syncWidgetPrayerLocation,
} from '../../features/settings/widgetSettingsBridge';
import { useTrackerStore } from '../../features/tracker/trackerStore';
import { localStorage } from '../../storage/mmkv';

const LOCAL_STORAGE_KEYS = [
  'al-salah-auth',
  'al-salah-settings',
  'al-salah-qaza-counts-v2',
  'al-salah-prayer-tracker-v3',
  'al-salah-backup-sync',
  'al-salah-qaza-counts',
  'al-salah-qaza-counts-v1',
  'al-salah-prayer-tracker',
  'al-salah-prayer-tracker-v1',
  'al-salah-prayer-tracker-v2',
] as const;

export async function resetLocalAppData(): Promise<void> {
  await Promise.allSettled([
    clearPersistedStorage(),
    clearLocalDatabase(),
  ]);

  resetStoresInMemory();
  syncWidgetIshaDeadlineMinutes(null);
  syncWidgetPrayerLocation(null);
  syncWidgetAdaptiveColorPreference(true);
  syncWidgetDarkThemePreference(false);
}

async function clearPersistedStorage(): Promise<void> {
  await Promise.all(
    LOCAL_STORAGE_KEYS.map(key => Promise.resolve(localStorage.removeItem(key))),
  );
}

function resetStoresInMemory(): void {
  useAuthStore.setState({
    authMode: null,
    displayName: '',
    email: null,
    isAuthenticated: false,
    onboardingCompleted: false,
    prayerLocation: null,
    pendingSession: null,
    hasHydrated: true,
  });

  useSettingsStore.setState({
    theme: 'System',
    language: 'English',
    calculationMethod: DEFAULT_CALCULATION_METHOD,
    asrMethod: DEFAULT_ASR_METHOD,
    ishaDeadlineMinutes: DEFAULT_ISHA_DEADLINE_MINUTES,
    location: null,
    use24HourTime: false,
    useAdaptiveWidgetColors: true,
    useDarkWidgetTheme: false,
    adhanNotifications: true,
    qazaReminders: true,
  });

  useQazaStore.setState({
    counts: createEmptyQazaCounts(),
    ishaSplitEnabled: false,
  });

  useTrackerStore.setState({
    logsByDate: {},
    processedMissedKeys: {},
  });

  useBackupSyncStore.setState({
    autoSyncFrequency: 'appOpen',
    lastSyncAt: null,
  });
}
