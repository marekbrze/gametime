# [0021] - teams: F1 ukryta w katalogu drużyn

**Date**: 2026-08-26
**Module**: teams
**Status**: Accepted

## Context

F1 nie ma encji Team w v1 — sesje są title-only (ADR-0007/0008), kierowcy/konstruktorzy nie są modelowani. Katalog teams musiał zdecydować: sekcja F1 z notką, ukrycie, czy modelowanie konstruktorów.

## Decision

**Ukryć F1 w katalogu teams** — `/teams` pokazuje tylko 7 lig zespołowych. Wydarzenia F1 pozostają w pełni dostępne przez kalendarz, watchlistę i filtry. Deep-link `/teams/league/f1` dostaje stan wyjaśniający („F1 has no teams in v1"), żeby stary/explicit URL nie wyglądał na bug. Modelowanie konstruktorów jako Team — otwarte Later (wymaga danych z OpenF1).

## Impact

- Bez zmian w shared docs (katalog Sport/League bez zmian — filtracja na poziomie ekranu teams).
- Zaakceptowany tradeoff: user przefiltrowany na F1 może szukać drużyny i nie znaleźć — odkupione brakiem martwej sekcji.
