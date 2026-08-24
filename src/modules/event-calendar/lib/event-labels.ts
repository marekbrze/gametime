import { LEAGUE_BY_ID, SPORT_BY_ID, TEAM_BY_ID } from '@/modules/data-source/data/catalog';
import type { SportEvent } from '@/modules/data-source/types';

export function sportEmoji(event: SportEvent): string {
  return SPORT_BY_ID.get(event.sportId)?.emoji ?? '🎯';
}

export function leagueName(event: SportEvent): string {
  return LEAGUE_BY_ID.get(event.leagueId)?.name ?? event.leagueId;
}

/** "Toronto Maple Leafs vs Boston Bruins" albo tytuł sesji motorsportu. */
export function participantsLabel(event: SportEvent): string {
  if (event.title) return event.title;
  return (event.teamIds ?? [])
    .map((id) => TEAM_BY_ID.get(id)?.name ?? id)
    .join(' vs ');
}
