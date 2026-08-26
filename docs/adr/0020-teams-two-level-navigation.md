# [0020] - teams: dwupoziomowa nawigacja katalogu + search na ekranie ligi

**Date**: 2026-08-26
**Module**: teams
**Status**: Accepted

## Context

Katalog to ~170 drużyn w 8 ligach (realny katalog ESPN). Do rozstrzygnięcia layout `/teams`: jeden ekran ze sekcjami lig, dwa poziomy nawigacji (karty lig → ekran ligi), czy search-first z autocomplete.

## Decision

**Dwa poziomy**: `/teams` = sekcja My teams (kafle ulubionych — quick access z ENTITY_MAP) + karty lig pogrupowane po sportach; `/teams/league/:leagueId` = lista drużyn alfabetycznie z gwiazdkami i **searchem tekstowym**; `/teams/team/:teamId` = terminarz. Jawne prefiksy `league/` i `team/` w ścieżkach, bo przestrzenie id kolidują wzorcem (React Router nie odróżni `/teams/:x` ligi od drużyny). Search to mechanika widoku ekranu ligi — dodana do ACTIONS.md jako „Search teams".

## Impact

- UI-STRATEGY.md: ścieżka `/teams/:teamId` (zarezerwowana) zastąpiona przez `/teams/league/:leagueId` + `/teams/team/:teamId`.
- ACTIONS.md: nowa akcja „Search teams"; „Browse teams" doprecyzowana o dwa poziomy.
- Odrzucone: jeden ekran ze wszystkimi ligami (scroll ~170 wierszy), search-first (słabsze odkrywanie katalogu).
