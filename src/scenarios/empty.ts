import type { AppData } from './types';

/**
 * Jawne puste tablice — bez tego hooki użyłyby swoich wartości domyślnych (mocków).
 */
export function emptyScenario(): AppData {
  return {
    'gametime.events': [],
    'gametime.watchlist': [],
    'gametime.favoriteTeams': [],
  };
}
