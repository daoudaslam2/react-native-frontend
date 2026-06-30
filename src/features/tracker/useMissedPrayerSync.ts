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

  useEffect(() => {
    if (
      !isAtOrAfterMissedCutoff(now, {
        calculationMethod,
        asrMethod,
        ishaDeadlineMinutes,
      })
    ) {
      return;
    }

    const previousDateKey = getPreviousPrayerDateKey(now);
    const missedPrayers = getAutoMissedPrayers({
      logs: logsByDate[previousDateKey],
      dateKey: previousDateKey,
      processedMissedKeys,
    });

    missedPrayers.forEach(prayer => {
      if (markMissedForQaza(previousDateKey, prayer)) {
        addMissed(prayer);
      }
    });
  }, [
    addMissed,
    asrMethod,
    calculationMethod,
    ishaDeadlineMinutes,
    logsByDate,
    markMissedForQaza,
    now,
    processedMissedKeys,
  ]);
}
