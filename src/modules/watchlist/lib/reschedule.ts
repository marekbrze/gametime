import type { SportEvent } from '@/modules/data-source/types';

/**
 * Nowa instancja przełożonego wydarzenia (harden watchlist #2, ADR-0018):
 * feed rodzi nowy Event z nowym terminem (ENTITY_MAP) — dopasowanie po
 * tej samej lidze + tym samym składzie drużyn, późniejszy start, bez
 * nadpisania statusu; najwcześniejszy kandydat. Tylko sporty drużynowe
 * (motorsport bez teamIds nie ma jednoznacznego dopasowania).
 */
export function findRescheduled(oldEvent: SportEvent, events: SportEvent[]): SportEvent | null {
  if (oldEvent.statusOverride !== 'postponed' || !oldEvent.teamIds?.length) return null;
  const oldTeams = [...oldEvent.teamIds].sort().join('|');
  const candidates = events.filter((event) => {
    if (event.statusOverride) return false;
    if (event.leagueId !== oldEvent.leagueId || !event.teamIds?.length) return false;
    if ([...event.teamIds].sort().join('|') !== oldTeams) return false;
    return event.startUtc > oldEvent.startUtc;
  });
  candidates.sort((a, b) => a.startUtc.localeCompare(b.startUtc));
  return candidates[0] ?? null;
}
