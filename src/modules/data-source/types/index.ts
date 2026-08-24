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
  /** nadpisuje status wyliczany z czasu (postponed/canceled z pipeline'u) */
  statusOverride?: Exclude<EventStatus, 'live' | 'finished'>;
}
