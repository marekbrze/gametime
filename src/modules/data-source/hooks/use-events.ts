import { useEffect, useState } from 'react';
import { registerCatalogTeams } from '../data/catalog';
import { generateMockEvents } from '../data/mock-events';
import type { DataSnapshot, SportEvent } from '../types';

/**
 * Źródło wydarzeń: statyczny `DataSnapshot` z `public/data.json` (data-pipeline,
 * ADR-0009), fetch same-origin. Fallback na mocki TYLKO w toolingu (dev server /
 * Storybook) — w prod mocki nie mogą udawać prawdziwych terminarzy (stan error).
 * Dev może wymusić pusty kalendarz przez scenariusz 'empty' (klucz gametime.devEvents).
 */

export type DataStatus = 'loading' | 'ready' | 'error';
export type EventSource = 'json' | 'mock' | 'override';

interface EventsState {
  events: SportEvent[];
  status: DataStatus;
  source: EventSource;
  generatedAt: string | null;
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

export function useEvents(): EventsState {
  const [state, setState] = useState<EventsState>(() => {
    const override = readDevOverride();
    if (override) {
      return { events: override, status: 'ready', source: 'override', generatedAt: null };
    }
    return { events: [], status: 'loading', source: 'json', generatedAt: null };
  });

  useEffect(() => {
    const override = readDevOverride();
    if (override) return; // initializer już zastosował override

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}data.json`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const snapshot = (await res.json()) as DataSnapshot;
        registerCatalogTeams(snapshot.catalog.teams);
        if (!cancelled) {
          setState({
            events: snapshot.events,
            status: 'ready',
            source: 'json',
            generatedAt: snapshot.generatedAt,
          });
        }
      } catch {
        if (cancelled) return;
        if (isTooling) {
          setState({ events: generateMockEvents(), status: 'ready', source: 'mock', generatedAt: null });
        } else {
          setState((prev) => ({ ...prev, status: 'error' }));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
