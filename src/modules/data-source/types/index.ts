/**
 * Encje katalogowe — Code Names z GLOSSARY.md.
 * UWAGA: encja "Wydarzenie" ma w kodzie nazwę `SportEvent` (nie `Event`),
 * żeby nie kolidować z globalnym typem DOM `Event`.
 */

export interface Sport {
  id: string;
  name: string;
  /** emoji do rozpoznania z pierwszego rzutu oka */
  emoji: string;
}

export interface League {
  id: string;
  name: string;
  sportId: string;
}

export interface Team {
  id: string;
  name: string;
  leagueId: string;
}

export type EventStatus = 'scheduled' | 'live' | 'finished' | 'postponed' | 'canceled';

/** Rodzaj sesji motorsportu (ADR-0008) — marker dla UI, nie do parsowania tytułu. */
export type SessionType = 'practice' | 'qualifying' | 'sprint' | 'race';

export interface SportEvent {
  id: string;
  sportId: string;
  leagueId: string;
  /** UTC ISO — jedyna prawda czasowa; prezentacja w strefie użytkownika */
  startUtc: string;
  /** wydarzenia drużynowe: referencje do katalogu Team */
  teamIds?: string[];
  /** motorsport i inne bez "A vs B": tytuł sesji, np. "Dutch GP — Race" */
  title?: string;
  /** rodzaj sesji motorsportu (F1 z OpenF1); wyścig UI wyróżnia po tym polu */
  sessionType?: SessionType;
  /** nadpisuje status wyliczany z czasu (postponed/canceled z pipeline'u) */
  statusOverride?: Exclude<EventStatus, 'live' | 'finished'>;
}

/** Kontrakt wyjścia data-pipeline — ADR-0009. Jedyna prawda o danych realnych. */
export interface DataWindow {
  from: string;
  to: string;
}

export interface DataSnapshot {
  /** ISO UTC generacji — świeżość danych (stopka UI, diagnostyka) */
  generatedAt: string;
  source: string;
  window: DataWindow;
  catalog: {
    sports: Sport[];
    leagues: League[];
    /** pełne składy lig; F1: [] (eventy title-only) */
    teams: Team[];
  };
  events: SportEvent[];
}
