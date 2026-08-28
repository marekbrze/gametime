import type { UserSettings } from '../types';

/**
 * Model dwugraniczny (ADR-0025): user edytuje DWIE granice — Day starts i
 * Evening starts; Noc jest przypięta do północy (0:00→Day starts), Wieczór
 * biegnie do 24:00. Pasma zawsze pokrywają całą dobę, zero luk i nakładek;
 * reprezentacja w storage (3× TimeBand) bez zmian — granice serializujemy
 * przy zapisie w bandsFromBoundaries.
 */

/** Krok steppera granic (30 min) — cała doba podzielna bez reszty. */
export const BOUNDARY_STEP = 30;

/** Dozwolone zakresy granic: 0:30 ≤ day < evening ≤ 23:30 (spec settings). */
export const DAY_START_MIN = 30; // 0:30
export const DAY_START_MAX = 23 * 60; // 23:00 (= evening 23:30 − krok)
export const EVENING_START_MIN = 1 * 60; // 1:00 (= day 0:30 + krok)
export const EVENING_START_MAX = 23 * 60 + 30; // 23:30

export interface BandBoundaries {
  dayStart: number;
  eveningStart: number;
}

/** Pasma z granic — jedyny serializer zapisu edycji pasm. */
export function bandsFromBoundaries({ dayStart, eveningStart }: BandBoundaries): UserSettings['bands'] {
  return {
    night: { kind: 'night', start: 0, end: dayStart },
    day: { kind: 'day', start: dayStart, end: eveningStart },
    evening: { kind: 'evening', start: eveningStart, end: 24 * 60 },
  };
}

/**
 * Granice ze stanu pasm (odczyt przy montażu ekranu). Bierzemy night.end i
 * evening.start — to dokładnie dwie edytowalne granice; niespójny kształt
 * (ręczna edycja storage) samonaprawia się przy pierwszym zapisie.
 */
export function boundariesFromBands(bands: UserSettings['bands']): BandBoundaries {
  return { dayStart: bands.night.end, eveningStart: bands.evening.start };
}

/**
 * Przesunięcie granicy o krok ze wzajemnym clampem (spec): day nie wejdzie na
 * evening ani poniżej 0:30, evening nie schodzi poniżej day ani powyżej 23:30.
 * Stepper na granicy po prostu dostaje tę samą wartość (przycisk disabled).
 */
export function shiftBoundary(
  boundary: 'dayStart' | 'eveningStart',
  value: number,
  direction: 1 | -1,
  other: number,
): number {
  const next = value + direction * BOUNDARY_STEP;
  if (boundary === 'dayStart') {
    return Math.min(Math.max(next, DAY_START_MIN), other - BOUNDARY_STEP);
  }
  return Math.max(Math.min(next, EVENING_START_MAX), other + BOUNDARY_STEP);
}

/** "06:00" z minut doby — spójnie z formatTimeInZone (24h, zero wiodące). */
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** "24:00" dla końca doby — pasma wieczoru kończą się na 1440. */
export function formatBandEnd(minutes: number): string {
  if (minutes >= 24 * 60) return '24:00';
  return formatMinutes(minutes);
}
