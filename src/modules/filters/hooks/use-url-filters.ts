import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LEAGUE_BY_ID, SPORT_BY_ID } from '@/modules/data-source/data/catalog';
import type { BandFilter, EventFilters } from '../types';
import { CLEAN_FILTERS } from '../types';
import { reconcileSport } from '../lib/filter-events';

/**
 * Stan widoku listy w URL (ADR-0014): `?w=<offset>&band=<kind>&sport=<id>&league=<id,...>`.
 * URL jest jedynym nośnikiem stanu filtrów — czysty start wizyty to wizyta bez
 * parametrów (ADR-0013); każda zmiana pushuje wpis historii, więc Back wraca po
 * zmianach widoku zamiast wychodzić z aplikacji.
 *
 * Parsowanie po ADR-0014: nieznane wartości ignorujemy cicho (dany wymiar wraca
 * do czystego), konflikt sport × liga rozstrzyga reguła z ADR-0012 (liga wygrywa).
 *
 * Zmiany liczą się od bieżącego stanu trzymanego w refie synchronizowanym z URL —
 * dwa szybkie kliknięcia (np. dwie ligi, +1 +1 w pagerze) łańcuchują się po refie,
 * a nie po nieodświeżonym jeszcze stanu routera (nawigacje w jednym ticu się
 * nadpisują, w przeciwieństwie do update queue Reacta).
 */
const BANDS: BandFilter[] = ['day', 'evening', 'night'];

function parseFilters(params: URLSearchParams): EventFilters {
  const bandParam = params.get('band');
  const band = BANDS.includes(bandParam as BandFilter) ? (bandParam as BandFilter) : 'all';

  const sportParam = params.get('sport');
  const sport = sportParam !== null && SPORT_BY_ID.has(sportParam) ? sportParam : 'all';

  const leagues = [...new Set(params.get('league')?.split(',') ?? [])].filter((id) =>
    LEAGUE_BY_ID.has(id),
  );

  return reconcileSport({ sport, band, leagues });
}

function parseWeek(params: URLSearchParams): number {
  const raw = Number.parseInt(params.get('w') ?? '0', 10);
  return Number.isInteger(raw) ? raw : 0;
}

/** Parametry tylko dla wartości niedomyślnych — czysty stan = czysty URL. */
function toSearchParams(filters: EventFilters, weekOffset: number): URLSearchParams {
  const params = new URLSearchParams();
  if (weekOffset !== 0) params.set('w', String(weekOffset));
  if (filters.band !== 'all') params.set('band', filters.band);
  if (filters.sport !== 'all') params.set('sport', filters.sport);
  if (filters.leagues.length > 0) params.set('league', filters.leagues.join(','));
  return params;
}

/** Aktualizacja filtrów wyliczona od ich bieżącego stanu (funkcjonalny updater). */
export type FiltersUpdater = (prev: EventFilters) => EventFilters;

export function useUrlFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);
  const weekOffset = parseWeek(searchParams);

  // Stan bieżący (równy URL-owi) do łańcuchowania szybkich zmian: render może
  // jeszcze nie zobaczyć ostatniej nawigacji, a ref już tak. Back/forward
  // (popstate) nadpisuje ref przy renderze z nowych parametrów.
  const current = useRef({ filters, weekOffset });
  current.current = { filters, weekOffset };

  /** Parametry ostatniego naszego pushu; null = ostatni stan pochodzi z URL
   * (Back/Forward albo start) — wtedy bazą zmian jest URL, nie ref. Chroni
   * przed wskrzeszaniem parametrów, gdy stan routera chwilowo rozjeżdża się
   * z historią przeglądarki (przerwana navigacja). */
  const pending = useRef<string | null>(null);

  useEffect(() => {
    const onPopState = () => {
      pending.current = null;
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  /** Push (nie replace) — Back ma wracać po zmianach widoku (#13 z ADR-0010). */
  const update = useCallback(
    (
      mutate: (prev: { filters: EventFilters; weekOffset: number }) => {
        filters: EventFilters;
        weekOffset: number;
      },
    ) => {
      let base = current.current;
      if (pending.current === null) {
        const urlParams = new URLSearchParams(window.location.hash.split('?')[1] ?? '');
        base = { filters: parseFilters(urlParams), weekOffset: parseWeek(urlParams) };
      }
      const next = mutate(base);
      current.current = next;
      const params = toSearchParams(next.filters, next.weekOffset);
      pending.current = params.toString();
      setSearchParams(params);
    },
    [setSearchParams],
  );

  const setFilters = useCallback(
    (updater: FiltersUpdater) => update((prev) => ({ ...prev, filters: updater(prev.filters) })),
    [update],
  );
  /** Przesunięcie pagera o delta tygodni — odliczane od bieżącego offsetu. */
  const shiftWeek = useCallback(
    (delta: number) =>
      update((prev) => ({ ...prev, weekOffset: prev.weekOffset + delta })),
    [update],
  );
  const setWeekOffset = useCallback(
    (offset: number) => update((prev) => ({ ...prev, weekOffset: offset })),
    [update],
  );
  /** Clear filters czyści wymiary paska, ale nie rusza tygodnia — to pozycja
   * widoku, nie filtr (user planuje dalej ten sam tydzień). */
  const clearFilters = useCallback(
    () => setFilters(() => CLEAN_FILTERS),
    [setFilters],
  );

  return { filters, weekOffset, setFilters, shiftWeek, setWeekOffset, clearFilters };
}
