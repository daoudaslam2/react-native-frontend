import React from 'react';

import { useAuthStore } from '../auth/authStore';
import { shouldAutoSync, useBackupSyncStore } from './backupSyncStore';

export function useBackupAutoSync(): void {
  const isLoggedIn = useAuthStore(
    state =>
      state.isAuthenticated &&
      state.onboardingCompleted &&
      state.authMode === 'localUser',
  );
  const autoSyncFrequency = useBackupSyncStore(
    state => state.autoSyncFrequency,
  );
  const lastSyncAt = useBackupSyncStore(state => state.lastSyncAt);
  const markSynced = useBackupSyncStore(state => state.markSynced);
  const syncedOnOpenRef = React.useRef(false);

  React.useEffect(() => {
    if (!isLoggedIn) {
      syncedOnOpenRef.current = false;
      return;
    }

    if (autoSyncFrequency === 'appOpen') {
      if (syncedOnOpenRef.current) {
        return;
      }

      syncedOnOpenRef.current = true;
      markSynced();
      return;
    }

    if (shouldAutoSync(autoSyncFrequency, lastSyncAt, new Date())) {
      markSynced();
    }
  }, [autoSyncFrequency, isLoggedIn, lastSyncAt, markSynced]);
}
