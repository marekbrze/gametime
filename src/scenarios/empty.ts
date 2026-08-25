import type { AppData } from './types';

/**
 * Jawny override: puste wydarzenia + puste listy usera.
 * 'gametime.devEvents' czyta useEvents w dev (w prod ignorowany) — bez tego
 * kalendarz pokazałby realny snapshot.
 */
export function emptyScenario(): AppData {
  return {
    'gametime.devEvents': [],
    'gametime.watchlist': [],
    'gametime.favoriteTeams': [],
  };
}
