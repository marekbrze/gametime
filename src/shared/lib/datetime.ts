/**
 * Narzędzia czasowe strefowe. Zasada: dane trzymamy w UTC (ISO),
 * prezentację liczymy w strefie użytkownika (settings.timezone, 'system' = przeglądarka).
 * Wszystkie funkcje działają przez Intl.formatToParts — poprawnie dla dowolnej strefy IANA.
 */

export type TimeZone = string | undefined; // undefined = strefa systemowa

export interface ZonedParts {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour: number; // 0-23
  minute: number; // 0-59
  weekday: number; // 0=Sunday … 6=Saturday
}

export function zonedParts(date: Date, tz: TimeZone): ZonedParts {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    // 'system' = strefa przeglądarki (ustawienie domyślne) — Intl oczekuje IANA albo undefined
    timeZone: tz === 'system' ? undefined : tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hourCycle: 'h23',
  });
  const map = new Map<string, string>();
  for (const part of fmt.formatToParts(date)) map.set(part.type, part.value);
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const wd = weekdays.indexOf(map.get('weekday') ?? '');
  return {
    year: Number(map.get('year')),
    month: Number(map.get('month')),
    day: Number(map.get('day')),
    hour: Number(map.get('hour')) % 24,
    minute: Number(map.get('minute')),
    weekday: wd === -1 ? 0 : wd,
  };
}

/** Minuty od północy w strefie użytkownika. */
export function minutesInZone(date: Date, tz: TimeZone): number {
  const p = zonedParts(date, tz);
  return p.hour * 60 + p.minute;
}

/** Klucz dnia kalendarzowego w strefie użytkownika, np. '2026-08-24'. */
export function dayKeyInZone(date: Date, tz: TimeZone): string {
  const p = zonedParts(date, tz);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

/**
 * Klucz dnia WIDOKOWEGO (ViewingDay): noc (0:00–6:00 wg pasa) należy do
 * wieczoru dnia poprzedniego — odejmujemy 24h i bierzemy klucz kalendarzowy.
 */
export function viewingDayKeyInZone(date: Date, tz: TimeZone, isNight: boolean): string {
  if (!isNight) return dayKeyInZone(date, tz);
  return dayKeyInZone(new Date(date.getTime() - 24 * 60 * 60 * 1000), tz);
}

/** Godzina startu, np. "19:30" (24h — jednoznaczne dla terminarzy). */
export function formatTimeInZone(date: Date, tz: TimeZone): string {
  const p = zonedParts(date, tz);
  return `${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`;
}

const WEEKDAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Wednesday, Aug 26" z klucza dnia 'YYYY-MM-DD'. */
export function formatDayLabel(dayKey: string): { weekday: string; date: string } {
  const [y, m, d] = dayKey.split('-').map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return { weekday: WEEKDAYS_LONG[wd], date: `${MONTHS_SHORT[m - 1]} ${d}` };
}

/** "Aug 24 – 30" / "Sep 28 – Oct 4" dla zakresu kluczy [first, last]. */
export function formatWeekRange(firstKey: string, lastKey: string): string {
  const fm = Number(firstKey.slice(5, 7));
  const fd = Number(firstKey.slice(8, 10));
  const lm = Number(lastKey.slice(5, 7));
  const ld = Number(lastKey.slice(8, 10));
  if (fm === lm) return `${MONTHS_SHORT[fm - 1]} ${fd} – ${ld}`;
  return `${MONTHS_SHORT[fm - 1]} ${fd} – ${MONTHS_SHORT[lm - 1]} ${ld}`;
}

/** Klucz poniedziałku tygodnia (europska niedziela→poniedziałek, ISO) zawierającego dayKey. */
export function weekStartKey(dayKey: string): string {
  const [y, m, d] = dayKey.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d));
  const shift = (utc.getUTCDay() + 6) % 7; // Mon=0 … Sun=6
  utc.setUTCDate(utc.getUTCDate() - shift);
  return `${utc.getUTCFullYear()}-${String(utc.getUTCMonth() + 1).padStart(2, '0')}-${String(
    utc.getUTCDate(),
  ).padStart(2, '0')}`;
}

/** 7 kluczy dnia od podanego poniedziałku. */
export function weekDayKeys(mondayKey: string): string[] {
  const [y, m, d] = mondayKey.split('-').map(Number);
  return Array.from({ length: 7 }, (_, i) => {
    const utc = new Date(Date.UTC(y, m - 1, d + i));
    return `${utc.getUTCFullYear()}-${String(utc.getUTCMonth() + 1).padStart(2, '0')}-${String(
      utc.getUTCDate(),
    ).padStart(2, '0')}`;
  });
}

/** Klucze dnia przesunięte o n tygodni. */
export function shiftWeekKey(mondayKey: string, weeks: number): string {
  const [y, m, d] = mondayKey.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + weeks * 7));
  return `${utc.getUTCFullYear()}-${String(utc.getUTCMonth() + 1).padStart(2, '0')}-${String(
    utc.getUTCDate(),
  ).padStart(2, '0')}`;
}

/** Elapsed/countdown "1h 12m" / "42m". */
export function formatDuration(ms: number): string {
  const totalMin = Math.max(0, Math.round(ms / 60_000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}
