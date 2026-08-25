import { useCallback, useEffect, useState } from 'react';
import { registerCatalogTeams } from '../data/catalog';
import { generateMockEvents } from '../data/mock-events';
import type { DataSnapshot, DataWindow, SportEvent } from '../types';

/**
 * Źródło wydarzeń: statyczny `DataSnapshot` z `public/data.json` (data-pipeline,
 * ADR-0009), fetch same-origin. Fallback na mocki TYLKO w toolingu (dev server /
 * Storybook) — w prod mocki nie mogą udawać prawdziwych terminarzy (stan error
 * z retry). Dev może wymusić puste/mockowe wydarzenia przez scenariusze
 * DevToolbar (klucz gametime.devEvents).
 */

export type DataStatus = 'loading' | 'ready' | 'error';
export type EventSource = 'json' | 'mock' | 'override';

interface EventsState {
  events: SportEvent[];
  status: DataStatus;
  source: EventSource;
  generatedAt: string | null;
  /** Okno danych snapshota — UI rozróżnia "pusty tydzień" od "poza oknem danych" */
  window: DataWindow | null;
}

const DEV_EVENTS_KEY = 'gametime.devEvents';

const isTooling = import.meta.env.DEV || Boolean(import.meta.env.STORYBOOK);

/** Override ze scenariuszy DevToolbar — tylko w dev. */
function readDevOverride(): SportEvent[] | null {
  if (import.meta.env.PROD) return null;
  const raw = localStorage.getItem(DEV_EVENTS_KEY);
  if (raw === null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SportEvent[]) : null;
  } catch {
    return null;
  }
}

async function fetchSnapshot(): Promise<DataSnapshot> {
  const res = await fetch(`${import.meta.env.BASE_URL}data.json`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as DataSnapshot;
}

export function useEvents(): EventsState & { refresh: () => void } {
  const [state, setState] = useState<EventsState>(() => {
    const override = readDevOverride();
    if (override) {
      return { events: override, status: 'ready', source: 'override', generatedAt: null, window: null };
    }
    return { events: [], status: 'loading', source: 'json', generatedAt: null, window: null };
  });

  const load = useCallback(async () => {
    try {
      const snapshot = await fetchSnapshot();
      registerCatalogTeams(snapshot.catalog.teams);
      setState({
        events: snapshot.events,
        status: 'ready',
        source: 'json',
        generatedAt: snapshot.generatedAt,
        window: snapshot.window,
      });
    } catch {
      if (isTooling) {
        setState({
          events: generateMockEvents(),
          status: 'ready',
          source: 'mock',
          generatedAt: null,
          window: null,
        });
      } else {
        setState((prev) => ({ ...prev, status: 'error' }));
      }
    }
  }, []);

  useEffect(() => {
    if (readDevOverride()) return; // initializer już zastosował override
    void load();
  }, [load]);

  /** Retry po błędzie — ponowny fetch bez przeładowania strony. */
  const refresh = useCallback(() => {
    if (readDevOverride()) return;
    setState((prev) => ({ ...prev, status: 'loading' }));
    void load();
  }, [load]);

  return { ...state, refresh };
}
