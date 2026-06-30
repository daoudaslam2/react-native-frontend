import { useEffect } from 'react';

import { useNow } from '../../hooks/useNow';
import { useQazaStore } from '../qaza/qazaStore';
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

  useEffect(() => {
    if (!isAtOrAfterMissedCutoff(now)) {
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
  }, [addMissed, logsByDate, markMissedForQaza, now, processedMissedKeys]);
}
