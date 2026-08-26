import type { TimeBandKind } from '@/modules/settings/types';

/** Filtr sportu: id sportu z katalogu albo 'all' (brak ograniczenia). */
export type SportFilter = string | 'all';

/** Filtr pasma: jedno z trzech pasm albo 'all' (dowolna pora). */
export type BandFilter = TimeBandKind | 'all';

/**
 * Stan filtrów jednej listy (ADR-0012): pasmo i sport to tier 1 paska,
 * ligi to multi-select z "More filters". Sport i ligi to dwa widoki jednego
 * stanu — uzgadniają się regułami z lib/filter-events (wybór sportu odznacza
 * obce ligi, obca liga przestawia sport na 'all').
 */
export interface EventFilters {
  sport: SportFilter;
  band: BandFilter;
  /** id lig z katalogu; [] = brak ograniczenia ligowego */
  leagues: string[];
}

/** Stan czysty — start każdej wizyty i wynik Clear filters (ADR-0013). */
export const CLEAN_FILTERS: EventFilters = { sport: 'all', band: 'all', leagues: [] };
