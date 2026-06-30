import dayjs from 'dayjs';

const PRAYER_TIME_DATE = '2026-01-01';

export function formatPrayerTime(
  time: string,
  use24HourTime: boolean,
): string {
  const parsedTime = parsePrayerTime(time);

  if (!parsedTime.isValid()) {
    return time;
  }

  return parsedTime.format(use24HourTime ? 'HH:mm' : 'h:mm A');
}

function parsePrayerTime(time: string): dayjs.Dayjs {
  const trimmedTime = time.trim();
  const timeWithSeconds =
    trimmedTime.length === 5 ? `${trimmedTime}:00` : trimmedTime;

  return dayjs(`${PRAYER_TIME_DATE}T${timeWithSeconds}`);
}
