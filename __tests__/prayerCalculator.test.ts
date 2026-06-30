import { DEFAULT_CALCULATION_METHOD } from '../src/constants/prayerSettings';
import { calculatePrayerSchedule } from '../src/services/prayer/prayerCalculator';
import { formatPrayerTime } from '../src/utils/dateTime';

describe('prayer calculator', () => {
  it('uses previous Isha before Fajr and points to today Fajr', () => {
    const schedule = calculatePrayerSchedule({
      now: new Date('2026-06-30T02:00:00+05:00'),
    });

    expect(schedule.summary.currentPrayer).toBe('Isha');
    expect(schedule.summary.nextPrayer).toBe('Fajr');
    expect(
      schedule.prayers.find(prayer => prayer.key === 'fajr')?.status,
    ).toBe('next');
  });

  it('uses Fajr as the active obligatory prayer before Dhuhr', () => {
    const schedule = calculatePrayerSchedule({
      now: new Date('2026-06-30T05:00:00+05:00'),
    });

    expect(schedule.summary.currentPrayer).toBe('Fajr');
    expect(schedule.summary.nextPrayer).toBe('Dhuhr');
    expect(
      schedule.prayers.find(prayer => prayer.key === 'fajr')?.status,
    ).toBe('current');
  });

  it('rolls the next prayer to tomorrow Fajr after Isha', () => {
    const schedule = calculatePrayerSchedule({
      now: new Date('2026-06-30T22:00:00+05:00'),
    });

    expect(schedule.summary.currentPrayer).toBe('Isha');
    expect(schedule.summary.nextPrayer).toBe('Fajr');
    expect(
      schedule.prayers.find(prayer => prayer.key === 'isha')?.status,
    ).toBe('current');
  });

  it('formats time in 12-hour and 24-hour modes', () => {
    const date = new Date('2026-06-30T10:05:00.000Z');

    expect(formatPrayerTime(date, false, 'Asia/Karachi')).toBe('3:05 PM');
    expect(formatPrayerTime(date, true, 'Asia/Karachi')).toBe('15:05');
  });

  it('moves Asr later when Hanafi method is selected', () => {
    const now = new Date('2026-06-30T12:00:00+05:00');
    const standard = calculatePrayerSchedule({
      now,
      calculationMethod: DEFAULT_CALCULATION_METHOD,
      asrMethod: 'standard',
    }).prayers.find(prayer => prayer.key === 'asr');
    const hanafi = calculatePrayerSchedule({
      now,
      calculationMethod: DEFAULT_CALCULATION_METHOD,
      asrMethod: 'hanafi',
    }).prayers.find(prayer => prayer.key === 'asr');

    if (!standard || !hanafi) {
      throw new Error('Asr prayer time was not calculated');
    }

    expect(hanafi.time > standard.time).toBe(true);
  });
});
