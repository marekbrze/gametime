# 0006 — Prezentacja listy: tryb widoku (list/cards) i pager tygodni kalendarzowych

**Date**: 2026-08-24
**Module**: event-calendar
**Status**: Accepted

## Context
Podczas detailingu otwarte pozostały: forma wydarzenia (wiersz vs karta) oraz kontrola zakresu dat. Owner nie chciał przesądzać formatu bez danych od użytkowników; zakres "next 7/14 days" odrzucił na rzecz tygodni kalendarzowych.

## Decision
1. **Toggle trybu widoku list ↔ cards** — eksperyment: oba formaty dostępne, wybór persystowany w `UserSettings.viewMode` (default `list`), adopcja pokaże preferencje. Zaktualizowano ACTIONS (Toggle view type) i ENTITY_MAP (UserSettings.viewMode).
2. **Pager tygodni kalendarzowych** — ‹ Previous / Next week › + This week; tydzień europejski od poniedziałku (do odwrócenia przy lofi). Zaktualizowano ACTIONS (Page weeks; Filter list — zakres = tygodnie).

## Impact
Rósł koszt utrzymania dwóch layoutów wiersza/karty — świadomie przyjęty na czas eksperymentu; decyzja o usunięciu jednego trybu zapada po obserwacji adopcji. Pager upraszcza model zakresów (znika pojęcie "niestandardowego zakresu" — zostaje stronicowanie tygodni).
