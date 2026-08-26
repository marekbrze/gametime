import type { SportEvent } from '@/modules/data-source/types';
import { deriveStatus, estimatedDurationMs } from '@/modules/data-source/lib/status';
import type { DayItem } from '@/modules/event-calendar/components/DayGroup';
import type { UserSettings } from '@/modules/settings/types';
import { bandOfDate } from '@/modules/settings/lib/time-bands';
import { viewingDayKeyInZone, type TimeZone } from '@/shared/lib/datetime';

export interface ScheduleDayGroups {
  /** dayKey (ViewingDay) → itemy posortowane po starcie */
  upcoming: Map<string, DayItem[]>;
  past: Map<string, DayItem[]>;
}

/**
 * Podział terminarza drużyny na nadchodzące i przeszłe — ta sama reguła co
 * watchlista (ENTITY_MAP: upcoming → past po upływie szacowanego czasu trwania,
 * nie po samym starcie). Grupowanie po dniach widokowych (ADR-0004).
 */
export function buildScheduleGroups(
  events: SportEvent[],
  now: Date,
  settings: UserSettings,
  tz: TimeZone,
  watchedIds: Set<string>,
  favoriteTeamIds: string[],
): ScheduleDayGroups {
  const upcoming = new Map<string, DayItem[]>();
  const past = new Map<string, DayItem[]>();

  for (const event of events) {
    const start = new Date(event.startUtc);
    const ended = now.getTime() >= start.getTime() + estimatedDurationMs(event);
    const band = bandOfDate(start, settings);
    const item: DayItem = {
      event,
      status: deriveStatus(event, now),
      band,
      watched: watchedIds.has(event.id),
      favorite: (event.teamIds ?? []).some((teamId) => favoriteTeamIds.includes(teamId)),
    };
    const groups = ended ? past : upcoming;
    const viewingKey = viewingDayKeyInZone(start, tz, band === 'night');
    const list = groups.get(viewingKey) ?? [];
    list.push(item);
    groups.set(viewingKey, list);
  }

  for (const list of [...upcoming.values(), ...past.values()]) {
    list.sort((a, b) => a.event.startUtc.localeCompare(b.event.startUtc));
  }
  return { upcoming, past };
}

const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** "September 2026" z klucza dnia — separator miesiąca w terminarzu (ADR-0022:
 *  sezon rozciąga się na wiele miesięcy, sam nagłówek dnia nie wystarcza). */
export function monthLabel(dayKey: string): string {
  const y = Number(dayKey.slice(0, 4));
  const m = Number(dayKey.slice(5, 7));
  return `${MONTHS_LONG[m - 1]} ${y}`;
}
