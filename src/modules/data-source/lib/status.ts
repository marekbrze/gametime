import type { EventStatus, SessionType, SportEvent } from '../types';

/**
 * Szacowany czas trwania per sport — live → finished bez realtime API (ADR-0005).
 * Soccer ~2h15, NHL/NBA ~2.5h, NFL ~3h15 (z overtime); domełka 3h dla nieznanych.
 */
const HOUR_MS = 3_600_000;
const SPORT_DURATION_MS: Record<string, number> = {
  soccer: 2.5 * HOUR_MS,
  hockey: 2.75 * HOUR_MS,
  basketball: 2.5 * HOUR_MS,
  'american-football': 3.5 * HOUR_MS,
};

/** F1: sesje mają różne długości — Race ~2h, treningi/kwalifikacje ~60–75 min. */
const F1_SESSION_DURATION_MS: Record<SessionType, number> = {
  practice: 1.5 * HOUR_MS,
  qualifying: 1.5 * HOUR_MS,
  sprint: 1.5 * HOUR_MS,
  race: 2 * HOUR_MS,
};

const DEFAULT_DURATION_MS = 3 * HOUR_MS;

export function estimatedDurationMs(event: SportEvent): number {
  if (event.sessionType) return F1_SESSION_DURATION_MS[event.sessionType];
  return SPORT_DURATION_MS[event.sportId] ?? DEFAULT_DURATION_MS;
}

/**
 * Status wyliczany z czasu startu (ADR-0005):
 * scheduled → live (start ≤ teraz < start+duration) → finished.
 * Nadpis z danych (postponed/canceled) wygrywa.
 */
export function deriveStatus(event: SportEvent, now: Date): EventStatus {
  if (event.statusOverride) return event.statusOverride;
  const start = new Date(event.startUtc).getTime();
  if (now.getTime() >= start + estimatedDurationMs(event)) return 'finished';
  if (now.getTime() >= start) return 'live';
  return 'scheduled';
}

/** Próg "starting soon" dla bloku Now (ADR-0005). */
export const STARTING_SOON_MS = 60 * 60 * 1000;

export function isStartingSoon(event: SportEvent, now: Date): boolean {
  if (event.statusOverride) return false;
  const start = new Date(event.startUtc).getTime();
  const diff = start - now.getTime();
  return diff > 0 && diff <= STARTING_SOON_MS;
}
