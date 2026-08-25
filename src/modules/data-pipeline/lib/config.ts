import type { DataWindow, SportEvent, Team } from '../../data-source/types';

/**
 * Konfiguracja źródeł data-pipeline (ADR-0007/0008).
 * Katalog Sport/League pozostaje w data-source/data/catalog.ts (jedna definicja
 * dla fallbacku mockowego i snapshota); tutaj tylko mapowanie liga → ścieżka ESPN.
 */

export interface EspnLeagueConfig {
  /** id ligi zgodne z katalogiem (catalog.ts LEAGUES) */
  leagueId: string;
  /** ścieżka ESPN: `site.api.espn.com/apis/site/v2/sports/{espnPath}/…` */
  espnPath: string;
}

/** 7 lig zespołowych z ESPN — F1 osobno z OpenF1 (ADR-0008). */
export const ESPN_LEAGUES: EspnLeagueConfig[] = [
  { leagueId: 'nhl', espnPath: 'hockey/nhl' },
  { leagueId: 'nba', espnPath: 'basketball/nba' },
  { leagueId: 'nfl', espnPath: 'football/nfl' },
  { leagueId: 'premier-league', espnPath: 'soccer/eng.1' },
  { leagueId: 'serie-a', espnPath: 'soccer/ita.1' },
  { leagueId: 'bundesliga', espnPath: 'soccer/ger.1' },
  { leagueId: 'la-liga', espnPath: 'soccer/esp.1' },
];

/** F1 w katalogu pod tym id (catalog.ts) — dane z OpenF1. */
export const F1_LEAGUE_ID = 'f1';

/**
 * ID w snapshocie są scopesowane ligą: per-sportowe przestrzenie ID ESPN kolidują
 * między sobą (probe 2026-08-25: 29–30 wspólnych ID drużyn między każdą parą lig).
 */
export function espnId(leagueId: string, id: string): string {
  return `espn-${leagueId}-${id}`;
}

export interface LeagueFetchResult {
  leagueId: string;
  events: SportEvent[];
  /** katalog drużyn ligi — pełny skład z endpointu teams */
  teams: Team[];
}

export type { DataWindow };
