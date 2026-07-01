import { useEffect } from 'react';

import { useNow } from '../../hooks/useNow';
import { useQazaStore } from '../qaza/qazaStore';
import { useSettingsStore } from '../settings/settingsStore';
import {
  getAutoMissedPrayers,
  getPreviousPrayerDateKey,
  isAtOrAfterMissedCutoff,
} from './trackerRules';
import { useTrackerStore } from './trackerStore';

export function useMissedPrayerSync(): void {
  const now = useNow(60_000);
  const logsByDate = useTrackerStore(state => state.logsByDate);
  const processedMissedKeys = useTrackerStore(
    state => state.processedMissedKeys,
  );
  const markMissedForQaza = useTrackerStore(state => state.markMissedForQaza);
  const addMissed = useQazaStore(state => state.addMissed);
  const calculationMethod = useSettingsStore(state => state.calculationMethod);
  const asrMethod = useSettingsStore(state => state.asrMethod);
  const ishaDeadlineMinutes = useSettingsStore(
    state => state.ishaDeadlineMinutes,
  );
  const location = useSettingsStore(state => state.location);

  useEffect(() => {
    if (!location) {
      return;
    }

    const trackingOptions = {
      calculationMethod,
      asrMethod,
      ishaDeadlineMinutes,
      location,
    };

    if (
      !isAtOrAfterMissedCutoff(now, trackingOptions)
    ) {
      return;
    }

    const previousDateKey = getPreviousPrayerDateKey(now, trackingOptions);
    const qazaPrayers = getAutoMissedPrayers({
      logs: logsByDate[previousDateKey],
      dateKey: previousDateKey,
      processedMissedKeys,
    });

    qazaPrayers.forEach(prayer => {
      if (markMissedForQaza(previousDateKey, prayer)) {
        addMissed(prayer);
      }
    });
  }, [
    addMissed,
    asrMethod,
    calculationMethod,
    ishaDeadlineMinutes,
    location,
    logsByDate,
    markMissedForQaza,
    now,
    processedMissedKeys,
  ]);
}
