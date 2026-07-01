import {
  MAX_ISHA_DEADLINE_MINUTES,
  type PrayerLocation,
} from '../src/constants/prayerSettings';
import {
  createInitialPrayerLogs,
  getAutoMissedPrayers,
  getPrayerTrackingDate,
  getPrayerTrackingDateKey,
  getPreviousPrayerDateKey,
  isAtOrAfterMissedCutoff,
} from '../src/features/tracker/trackerRules';
import { calculatePrayerSchedule } from '../src/services/prayer/prayerCalculator';

const TEST_PRAYER_LOCATION: PrayerLocation = {
  label: 'Test location',
  latitude: 31.50248,
  longitude: 74.321451,
  timeZone: 'Asia/Karachi',
  source: 'manual',
};

describe('tracker cutoff rules', () => {
  it('uses the current prayer day after the default Isha deadline', () => {
    const now = new Date('2026-06-30T01:30:00+05:00');
    const options = { location: TEST_PRAYER_LOCATION };

    expect(getPrayerTrackingDateKey(now, options)).toBe('2026-06-30');
    expect(isAtOrAfterMissedCutoff(now, options)).toBe(true);
  });

  it('keeps the previous prayer day active before a custom 2 AM deadline', () => {
    const now = new Date('2026-06-30T01:30:00+05:00');
    const options = {
      ishaDeadlineMinutes: MAX_ISHA_DEADLINE_MINUTES,
      location: TEST_PRAYER_LOCATION,
    };

    expect(getPrayerTrackingDateKey(now, options)).toBe('2026-06-29');
    expect(isAtOrAfterMissedCutoff(now, options)).toBe(false);
  });

  it('moves to the current prayer day at the custom 2 AM deadline', () => {
    const now = new Date('2026-06-30T02:00:00+05:00');
    const options = {
      ishaDeadlineMinutes: MAX_ISHA_DEADLINE_MINUTES,
      location: TEST_PRAYER_LOCATION,
    };

    expect(getPrayerTrackingDateKey(now, options)).toBe('2026-06-30');
    expect(getPreviousPrayerDateKey(now, options)).toBe('2026-06-29');
    expect(isAtOrAfterMissedCutoff(now, options)).toBe(true);
  });

  it('uses the new day prayer timeline after the configured Isha deadline', () => {
    const beforeCutoff = new Date('2026-06-30T01:30:00+05:00');
    const afterCutoff = new Date('2026-06-30T02:00:00+05:00');
    const options = {
      ishaDeadlineMinutes: MAX_ISHA_DEADLINE_MINUTES,
      location: TEST_PRAYER_LOCATION,
    };
    const beforeSchedule = calculatePrayerSchedule({
      now: beforeCutoff,
      scheduleDate: getPrayerTrackingDate(beforeCutoff, options),
      ...options,
    });
    const afterSchedule = calculatePrayerSchedule({
      now: afterCutoff,
      scheduleDate: getPrayerTrackingDate(afterCutoff, options),
      ...options,
    });

    expect(beforeSchedule.prayers[0].id).toBe('fajr-2026-06-29');
    expect(beforeSchedule.summary.gregorianDate).toBe('Mon, Jun 29');
    expect(afterSchedule.prayers[0].id).toBe('fajr-2026-06-30');
    expect(afterSchedule.summary.gregorianDate).toBe('Tue, Jun 30');
  });

  it('auto-adds only unresolved prayers to qaza once', () => {
    const logs = createInitialPrayerLogs();
    logs.fajr = { status: 'completed' };
    logs.dhuhr = { status: 'completed' };
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
