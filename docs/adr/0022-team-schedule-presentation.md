# [0022] - teams: prezentacja terminarza i link „Go to team schedule" w dialogu

**Date**: 2026-08-26
**Module**: teams
**Status**: Accepted

## Context

Dwie decyzje szczegółowe prezentacji: (1) jak pokazać sezon (setki wydarzeń, ~9 miesięcy) na ekranie terminarza i czym go filtrować; (2) gdzie umieścić akcję „Go to team schedule" z ACTIONS.md — EventRow nie ma dziś żadnego toru do terminarza.

## Decision

1. **Terminarz = wzorzec watchlisty (ADR-0018)**: nadchodzące po ViewingDay (reuse DayGroup/EventRow) + zwinięta sekcja „Past ({n})" na dole; separatory miesięcy w nadchodzących. Filtrowanie: wspólny FilterBar w **wariancie bands-only** — sport/liga przy jednej drużynie nie niosą informacji (zasada uniwersalna z ACTIONS.md dotyczy list wielodrużynowych).
2. **„Go to team schedule" w EventDetailsDialog**: uczestnicy wydarzenia w dialogu szczegółów stają się linkami do `/teams/team/:teamId` (dialog zamyka się przed nawigacją). Wiersz listy (EventRow) zostaje zwarty — nie dostaje drugiego klikalnego celu obok otwierania szczegółów.

## Impact

- Bez zmian w shared docs — implementacja obu decyzji w `proto-lofi` modułu teams.
- EventDetailsDialog (watchlist) zyskuje linki uczestników; komponent pozostaje własnością modułu watchlist.
- Odrzucone: link w EventRow (drugi klikalny cel w wierszu), deferring akcji (ACTIONS.md obiecuje ją już teraz).
