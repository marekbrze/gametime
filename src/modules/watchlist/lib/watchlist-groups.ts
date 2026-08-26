import type { SportEvent } from '@/modules/data-source/types';
import { deriveStatus, estimatedDurationMs } from '@/modules/data-source/lib/status';
import type { DayItem } from '@/modules/event-calendar/components/DayGroup';
import type { UserSettings } from '@/modules/settings/types';
import { bandOfDate } from '@/modules/settings/lib/time-bands';
import { viewingDayKeyInZone, type TimeZone } from '@/shared/lib/datetime';

export interface WatchlistDayGroups {
  /** dayKey (ViewingDay) → itemy posortowane po starcie */
  upcoming: Map<string, DayItem[]>;
  past: Map<string, DayItem[]>;
}

/**
 * Podział obserwowanych wydarzeń na nadchodzące i przeszłe (ENTITY_MAP:
 * przejście upcoming → past jest automatyczne, po zakończeniu wydarzenia —
 * czyli po upływie szacowanego czasu trwania, nie po samym starcie).
 * Grupowanie po dniach widokowych — identycznie jak w kalendarzu (ADR-0004).
 */
export function buildWatchlistGroups(
  events: SportEvent[],
  now: Date,
  settings: UserSettings,
  tz: TimeZone,
  favoriteTeamIds: string[],
): WatchlistDayGroups {
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
      watched: true,
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
