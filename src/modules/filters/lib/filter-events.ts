import { LEAGUE_BY_ID, SPORT_BY_ID } from '@/modules/data-source/data/catalog';
import type { SportEvent } from '@/modules/data-source/types';
import { bandOfDate } from '@/modules/settings/lib/time-bands';
import type { UserSettings } from '@/modules/settings/types';
import type { BandFilter, EventFilters, SportFilter } from '../types';
import { CLEAN_FILTERS } from '../types';

/** Czy wydarzenie przechodzi przez filtry (sport × ligi + pasmo). */
export function matchesEventFilters(
  event: SportEvent,
  filters: EventFilters,
  settings: UserSettings,
): boolean {
  // Lig i sport to jeden wymiar competition: jeśli ligi są wybrane,
  // one decydują (są zawsze ⊆ wybranego sportu — patrz reconcileSport);
  // w przeciwnym razie decyduje sam sport.
  if (filters.leagues.length > 0) {
    if (!filters.leagues.includes(event.leagueId)) return false;
  } else if (filters.sport !== 'all' && event.sportId !== filters.sport) {
    return false;
  }
  if (
    filters.band !== 'all' &&
    bandOfDate(new Date(event.startUtc), settings) !== filters.band
  ) {
    return false;
  }
  return true;
}

/**
 * Uzgadnianie sport × liga (ADR-0012): wybrane ligi muszą należeć do
 * wybranego sportu; obca liga przestawia sport na 'all' (liga wygrywa).
 */
export function reconcileSport(filters: EventFilters): EventFilters {
  if (filters.sport === 'all') return filters;
  const hasForeign = filters.leagues.some(
    (id) => LEAGUE_BY_ID.get(id)?.sportId !== filters.sport,
  );
  return hasForeign ? { ...filters, sport: 'all' } : filters;
}

/** Zaznacz/odznacz ligę w multi-selekcji; trzyma reguły uzgadniania. */
export function toggleLeague(filters: EventFilters, leagueId: string): EventFilters {
  if (!LEAGUE_BY_ID.has(leagueId)) return filters;
  const leagues = filters.leagues.includes(leagueId)
    ? filters.leagues.filter((id) => id !== leagueId)
    : [...filters.leagues, leagueId];
  return reconcileSport({ ...filters, leagues });
}

/** Wybór sportu (albo 'all'); wybór konkretnego sportu odznacza ligi innych sportów. */
export function selectSport(filters: EventFilters, sport: SportFilter): EventFilters {
  if (sport === 'all') return { ...filters, sport: 'all' };
  if (!SPORT_BY_ID.has(sport)) return filters;
  const leagues = filters.leagues.filter((id) => LEAGUE_BY_ID.get(id)?.sportId === sport);
  return { ...filters, sport, leagues };
}

/** Wybór pasma (albo 'all'). */
export function selectBand(filters: EventFilters, band: BandFilter): EventFilters {
  return { ...filters, band };
}

/** Licznik na "More filters" — zlicza tylko wybory tieru 2, czyli ligi (ADR-0012). */
export function leagueCount(filters: EventFilters): number {
  return filters.leagues.length;
}

/** Czy którykolwiek wymiar paska jest aktywny (napędza EmptyWeek). */
export function hasActiveFilters(filters: EventFilters): boolean {
  return (
    filters.sport !== CLEAN_FILTERS.sport ||
    filters.band !== CLEAN_FILTERS.band ||
    filters.leagues.length > 0
  );
}
