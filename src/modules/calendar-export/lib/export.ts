import type { SportEvent } from '@/modules/data-source/types';
import { estimatedDurationMs } from '@/modules/data-source/lib/status';
import { LEAGUE_BY_ID, TEAM_BY_ID } from '@/modules/data-source/data/catalog';

/** Tytuł wydarzenia dla kalendarza: "Leafs vs Bruins (NHL)" / "Dutch GP — Race (F1)". */
export function eventTitle(event: SportEvent): string {
  const league = LEAGUE_BY_ID.get(event.leagueId);
  const label = event.title ?? event.teamIds?.map((id) => shortTeamName(id)).join(' vs ');
  return `${label} (${league?.name ?? event.leagueId})`;
}

/** Ostatni człon nazwy: "Toronto Maple Leafs" → "Maple Leafs" (krócej w kalendarzu). */
function shortTeamName(teamId: string): string {
  const name = TEAM_BY_ID.get(teamId)?.name ?? teamId;
  const parts = name.split(' ');
  return parts.length > 2 ? parts.slice(-2).join(' ') : name;
}

function toIcsStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** Link "dodaj do Google Calendar" (TEMPLATE). */
export function googleCalendarUrl(event: SportEvent): string {
  const start = new Date(event.startUtc);
  const end = new Date(start.getTime() + estimatedDurationMs(event));
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: eventTitle(event),
    dates: `${toIcsStamp(start)}/${toIcsStamp(end)}`,
    details: 'Added from gametime',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Plik ICS (Apple Calendar / uniwersalny) — pobieranie przez blob. */
export function downloadIcs(event: SportEvent): void {
  const start = new Date(event.startUtc);
  const end = new Date(start.getTime() + estimatedDurationMs(event));
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//gametime//EN',
    'BEGIN:VEVENT',
    `UID:${event.id}@gametime`,
    `DTSTAMP:${toIcsStamp(new Date())}`,
    `DTSTART:${toIcsStamp(start)}`,
    `DTEND:${toIcsStamp(end)}`,
    `SUMMARY:${eventTitle(event)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${eventTitle(event).replace(/[^\w-]+/g, '_')}.ics`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
