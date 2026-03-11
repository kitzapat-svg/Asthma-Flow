// lib/date-utils.ts
// Bangkok timezone (GMT+7) utilities
// Ensures consistent date/time handling regardless of server timezone (e.g., Vercel = UTC)

const BANGKOK_TZ = 'Asia/Bangkok';

/**
 * Get current date string in Bangkok timezone: "2026-03-10"
 */
export function getBangkokDateString(): string {
  return toBangkokDateString(new Date());
}

/**
 * Convert any Date to a date string in Bangkok timezone: "2026-03-10"
 */
export function toBangkokDateString(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: BANGKOK_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date); // "YYYY-MM-DD" format from en-CA locale
}

/**
 * Get Bangkok date parts (year, month, day, hours, minutes, seconds)
 */
export function getBangkokDateParts(date: Date = new Date()): {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BANGKOK_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => {
    const part = parts.find(p => p.type === type);
    return parseInt(part?.value || '0', 10);
  };

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hours: get('hour'),
    minutes: get('minute'),
    seconds: get('second'),
  };
}

/**
 * Get ISO-like timestamp with +07:00 offset: "2026-03-10T13:37:52+07:00"
 * This preserves the actual Bangkok time in the stored value.
 */
export function getBangkokISOString(): string {
  const p = getBangkokDateParts();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hours)}:${pad(p.minutes)}:${pad(p.seconds)}+07:00`;
}

/**
 * Get formatted timestamp for logs: "2026-03-10 13:37:52"
 */
export function getBangkokTimestamp(): string {
  const p = getBangkokDateParts();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${p.year}-${pad(p.month)}-${pad(p.day)} ${pad(p.hours)}:${pad(p.minutes)}:${pad(p.seconds)}`;
}

/**
 * Create a Date object adjusted to represent Bangkok midnight for a given date.
 * Useful for date comparisons in client-side code when the server may be in UTC.
 */
export function toBangkokMidnight(date: Date): Date {
  const dateStr = toBangkokDateString(date);
  // Parse as Bangkok midnight
  return new Date(dateStr + 'T00:00:00+07:00');
}
