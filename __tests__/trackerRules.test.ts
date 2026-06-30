import {
  createInitialPrayerLogs,
  getAutoMissedPrayers,
  getPrayerTrackingDateKey,
  getPreviousPrayerDateKey,
  isAtOrAfterMissedCutoff,
} from '../src/features/tracker/trackerRules';

describe('tracker cutoff rules', () => {
  it('keeps the previous prayer day active before 2 AM', () => {
    const now = new Date('2026-06-30T01:30:00+05:00');

    expect(getPrayerTrackingDateKey(now)).toBe('2026-06-29');
    expect(isAtOrAfterMissedCutoff(now)).toBe(false);
  });

  it('moves to the current prayer day at 2 AM', () => {
    const now = new Date('2026-06-30T02:00:00+05:00');

    expect(getPrayerTrackingDateKey(now)).toBe('2026-06-30');
    expect(getPreviousPrayerDateKey(now)).toBe('2026-06-29');
    expect(isAtOrAfterMissedCutoff(now)).toBe(true);
  });

  it('auto-misses only unresolved prayers once', () => {
    const logs = createInitialPrayerLogs();
    logs.fajr = { status: 'completed' };
    logs.dhuhr = { status: 'late' };
    logs.asr = { status: 'pending' };
    logs.maghrib = { status: 'qaza' };
    logs.isha = { status: 'upcoming' };

    expect(
      getAutoMissedPrayers({
        logs,
        dateKey: '2026-06-29',
        processedMissedKeys: {
          '2026-06-29:isha': true,
        },
      }),
    ).toEqual(['asr']);
  });
});
